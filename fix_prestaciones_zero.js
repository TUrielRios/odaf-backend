/**
 * Script de migración para corregir prestaciones con monto_total = 0
 * que fueron generadas automáticamente desde planes de tratamiento.
 *
 * Ejecutar desde la carpeta backend/:
 *   node fix_prestaciones_zero.js
 *
 * Requiere las variables de entorno del .env (DB_NAME, DB_USER, etc.)
 */
require("dotenv").config()
const { Sequelize, Op } = require("sequelize")

const db = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  dialect: "postgres",
  logging: false,
})

async function run() {
  await db.authenticate()
  console.log("✅ Conectado a la base de datos\n")

  // Asegurarse que la columna tratamiento_id existe
  await db.query(`
    ALTER TABLE prestaciones
    ADD COLUMN IF NOT EXISTS tratamiento_id INTEGER REFERENCES tratamientos(id) ON UPDATE CASCADE ON DELETE SET NULL;
  `)
  console.log("✅ Columna tratamiento_id verificada\n")

  // 1. Traer todas las prestaciones Pendiente con monto_total = 0
  const [prestaciones] = await db.query(`
    SELECT p.id, p.profesional_id, p.fecha, p.porcentaje_profesional, p.observaciones, p.turno_id, p.tratamiento_id
    FROM prestaciones p
    WHERE p.monto_total = 0
      AND p.estado = 'Pendiente'
      AND p.liquidacion_id IS NULL
    ORDER BY p.fecha ASC, p.id ASC
  `)

  console.log(`📋 Prestaciones con $0 encontradas: ${prestaciones.length}\n`)

  // Mostrar resumen
  prestaciones.forEach((p, i) => {
    console.log(
      `  [${i + 1}] id=${p.id} fecha=${p.fecha}` +
      ` profesional_id=${p.profesional_id}` +
      ` turno_id=${p.turno_id ?? "null"}` +
      ` tratamiento_id=${p.tratamiento_id ?? "null"}` +
      ` obs="${(p.observaciones || "").substring(0, 70)}"`
    )
  })

  console.log("\n─────────────────────────────────────────────\n")

  let actualizadas = 0
  let sinPrecio = 0
  const errores = []

  // Cache por plan_id => lista de tratamientos Terminado
  const cachePlanes = new Map()

  for (const prestacion of prestaciones) {
    let montoTotal = 0
    const porcentaje = parseFloat(prestacion.porcentaje_profesional) || 50

    // ── Caso 1: tiene tratamiento_id directo ──────────────────────────────
    if (prestacion.tratamiento_id) {
      const [[trat]] = await db.query(`
        SELECT precio_paciente, cobertura_obra_social
        FROM tratamientos
        WHERE id = :id
      `, { replacements: { id: prestacion.tratamiento_id } })

      if (trat) {
        montoTotal = parseFloat(trat.precio_paciente || 0) + parseFloat(trat.cobertura_obra_social || 0)
        console.log(`  [id=${prestacion.id}] via tratamiento_id=${prestacion.tratamiento_id}: precio_paciente=${trat.precio_paciente} cobertura=${trat.cobertura_obra_social} => $${montoTotal}`)
      }

    // ── Caso 2: viene de plan de tratamiento (sin turno, con observaciones) ──
    } else if (!prestacion.turno_id) {
      const match = (prestacion.observaciones || "").match(/Plan de Tratamiento #(\d+)/)
      if (match) {
        const planId = parseInt(match[1])

        if (!cachePlanes.has(planId)) {
          const [tratamientos] = await db.query(`
            SELECT id, profesional_id, precio_paciente, cobertura_obra_social, fecha_inicio, "updatedAt"
            FROM tratamientos
            WHERE plan_tratamiento_id = :planId
              AND estado = 'Terminado'
            ORDER BY "updatedAt" ASC
          `, { replacements: { planId } })

          console.log(`\n  Plan #${planId}: ${tratamientos.length} tratamientos Terminado encontrados`)
          tratamientos.forEach(t =>
            console.log(`    tratamiento id=${t.id} profesional_id=${t.profesional_id} precio_paciente=${t.precio_paciente} cobertura=${t.cobertura_obra_social} updatedAt=${t.updatedAt}`)
          )

          cachePlanes.set(planId, { todos: tratamientos, usados: new Set() })
        }

        const { todos, usados } = cachePlanes.get(planId)
        const disponibles = todos.filter(t => !usados.has(t.id))

        const toDate = (d) => {
          if (!d) return ""
          const dt = new Date(d)
          return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
        }

        // Intentar coincidir por fecha
        let matching = disponibles.find(t => toDate(t.updatedAt) === prestacion.fecha)
        if (!matching) matching = disponibles[0] // fallback: primer disponible

        if (matching) {
          montoTotal = parseFloat(matching.precio_paciente || 0) + parseFloat(matching.cobertura_obra_social || 0)
          usados.add(matching.id)
          console.log(`  [id=${prestacion.id}] Plan #${planId} → tratamiento id=${matching.id} => $${montoTotal}`)
        } else {
          console.log(`  [id=${prestacion.id}] Plan #${planId} → SIN TRATAMIENTO DISPONIBLE (${disponibles.length} disponibles)`)
        }
      } else {
        console.log(`  [id=${prestacion.id}] Sin turno_id y sin patrón en observaciones: "${prestacion.observaciones || ""}"`)
      }

    // ── Caso 3: viene de turno ────────────────────────────────────────────
    } else {
      const [[turnoRow]] = await db.query(`
        SELECT t.id, t.servicio_id, t.subservicio_id,
               sv.precio_base as servicio_precio,
               ss.precio as sub_precio
        FROM turnos t
        LEFT JOIN servicios sv ON sv.id = t.servicio_id
        LEFT JOIN sub_servicios ss ON ss.id = t.subservicio_id
        WHERE t.id = :turno_id
      `, { replacements: { turno_id: prestacion.turno_id } })

      if (turnoRow) {
        if (parseFloat(turnoRow.sub_precio || 0) > 0) {
          montoTotal = parseFloat(turnoRow.sub_precio)
        } else {
          montoTotal = parseFloat(turnoRow.servicio_precio || 0)
        }
        console.log(`  [id=${prestacion.id}] via turno_id=${prestacion.turno_id}: sub_precio=${turnoRow.sub_precio} servicio_precio=${turnoRow.servicio_precio} => $${montoTotal}`)
      }
    }

    // ── Actualizar ────────────────────────────────────────────────────────
    if (montoTotal > 0) {
      const montoProfesional = parseFloat(((montoTotal * porcentaje) / 100).toFixed(2))
      try {
        await db.query(`
          UPDATE prestaciones
          SET monto_total = :montoTotal, monto_profesional = :montoProfesional
          WHERE id = :id
        `, { replacements: { montoTotal, montoProfesional, id: prestacion.id } })
        actualizadas++
        console.log(`  ✅ Actualizada prestacion id=${prestacion.id}: monto_total=$${montoTotal} monto_prof=$${montoProfesional}`)
      } catch (err) {
        errores.push({ id: prestacion.id, error: err.message })
        console.error(`  ❌ Error actualizando id=${prestacion.id}: ${err.message}`)
      }
    } else {
      sinPrecio++
      console.log(`  ⚠️  id=${prestacion.id} sigue en $0 — no se encontró precio`)
    }
  }

  console.log("\n═══════════════════════════════════════════════")
  console.log(`Total revisadas: ${prestaciones.length}`)
  console.log(`✅ Actualizadas: ${actualizadas}`)
  console.log(`⚠️  Sin precio disponible: ${sinPrecio}`)
  if (errores.length > 0) {
    console.log(`❌ Errores: ${errores.length}`)
    errores.forEach(e => console.log(`   id=${e.id}: ${e.error}`))
  }
  console.log("═══════════════════════════════════════════════\n")

  await db.close()
}

run().catch((err) => {
  console.error("❌ Error fatal:", err)
  process.exit(1)
})
