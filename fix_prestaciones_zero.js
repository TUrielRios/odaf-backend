/**
 * Script de migración en dos fases:
 *
 *  Fase 1 – Prestaciones con monto_total = 0 (sin precio)
 *            Busca el precio en el tratamiento/turno correspondiente y recalcula.
 *
 *  Fase 2 – Prestaciones con monto_total > 0 pero porcentaje_profesional
 *            no coincide con el porcentaje_comision actual del profesional.
 *            (Caso típico: se crearon con 100 % y no se aplicó la comisión real.)
 *            Recalcula monto_profesional = monto_total × comision / 100.
 *
 * Ejecutar desde la carpeta backend/:
 *   node fix_prestaciones_zero.js
 */
require("dotenv").config()
const { Sequelize } = require("sequelize")

const db = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  dialect: "postgres",
  logging: false,
})

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const cacheProfesionales = new Map()
async function getPorcentaje(profesional_id) {
  if (!cacheProfesionales.has(profesional_id)) {
    const [[prof]] = await db.query(
      `SELECT porcentaje_comision FROM profesionales WHERE id = :id`,
      { replacements: { id: profesional_id } }
    )
    const pct = prof ? parseFloat(prof.porcentaje_comision) || 50 : 50
    cacheProfesionales.set(profesional_id, pct)
    console.log(`  Profesional id=${profesional_id}: porcentaje_comision=${pct}%`)
  }
  return cacheProfesionales.get(profesional_id)
}

const toDate = (d) => {
  if (!d) return ""
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
}

// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  await db.authenticate()
  console.log("✅ Conectado a la base de datos\n")

  // Asegurar columna tratamiento_id
  await db.query(`
    ALTER TABLE prestaciones
    ADD COLUMN IF NOT EXISTS tratamiento_id INTEGER
      REFERENCES tratamientos(id) ON UPDATE CASCADE ON DELETE SET NULL;
  `)
  console.log("✅ Columna tratamiento_id verificada\n")

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 1: prestaciones con monto_total = 0  →  buscar precio real
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("╔═══════════════════════════════════════════════╗")
  console.log("║  FASE 1 – Prestaciones con monto_total = $0   ║")
  console.log("╚═══════════════════════════════════════════════╝\n")

  const [fase1] = await db.query(`
    SELECT p.id, p.profesional_id, p.fecha, p.porcentaje_profesional,
           p.observaciones, p.turno_id, p.tratamiento_id
    FROM prestaciones p
    WHERE p.monto_total = 0
      AND p.estado = 'Pendiente'
      AND p.liquidacion_id IS NULL
    ORDER BY p.fecha ASC, p.id ASC
  `)

  console.log(`📋 Encontradas: ${fase1.length}\n`)

  let f1actualizadas = 0
  let f1sinPrecio = 0
  const cachePlanes = new Map()

  for (const p of fase1) {
    let montoTotal = 0
    const porcentaje = await getPorcentaje(p.profesional_id)

    if (p.tratamiento_id) {
      // Tiene FK directa al tratamiento
      const [[trat]] = await db.query(
        `SELECT precio_paciente, cobertura_obra_social FROM tratamientos WHERE id = :id`,
        { replacements: { id: p.tratamiento_id } }
      )
      if (trat) {
        montoTotal = parseFloat(trat.precio_paciente || 0) + parseFloat(trat.cobertura_obra_social || 0)
        console.log(`  [id=${p.id}] tratamiento_id=${p.tratamiento_id}: precio_paciente=${trat.precio_paciente} cobertura=${trat.cobertura_obra_social} => $${montoTotal}`)
      }

    } else if (!p.turno_id) {
      // Generado desde plan de tratamiento (observaciones contienen el id del plan)
      const match = (p.observaciones || "").match(/Plan de Tratamiento #(\d+)/)
      if (match) {
        const planId = parseInt(match[1])

        if (!cachePlanes.has(planId)) {
          const [tratamientos] = await db.query(`
            SELECT id, precio_paciente, cobertura_obra_social, "updatedAt"
            FROM tratamientos
            WHERE plan_tratamiento_id = :planId AND estado = 'Terminado'
            ORDER BY "updatedAt" ASC
          `, { replacements: { planId } })
          console.log(`\n  Plan #${planId}: ${tratamientos.length} tratamientos Terminado`)
          tratamientos.forEach(t =>
            console.log(`    id=${t.id} precio_paciente=${t.precio_paciente} cobertura=${t.cobertura_obra_social} updatedAt=${t.updatedAt}`)
          )
          cachePlanes.set(planId, { todos: tratamientos, usados: new Set() })
        }

        const { todos, usados } = cachePlanes.get(planId)
        const disponibles = todos.filter(t => !usados.has(t.id))
        let matching = disponibles.find(t => toDate(t.updatedAt) === p.fecha) || disponibles[0]

        if (matching) {
          montoTotal = parseFloat(matching.precio_paciente || 0) + parseFloat(matching.cobertura_obra_social || 0)
          usados.add(matching.id)
          console.log(`  [id=${p.id}] Plan #${planId} → tratamiento id=${matching.id} => $${montoTotal}`)
        } else {
          console.log(`  [id=${p.id}] Plan #${planId} → SIN TRATAMIENTO DISPONIBLE`)
        }
      } else {
        console.log(`  [id=${p.id}] Sin patrón en observaciones: "${(p.observaciones || "").substring(0, 70)}"`)
      }

    } else {
      // Generado desde turno
      const [[turno]] = await db.query(`
        SELECT sv.precio_base AS servicio_precio, ss.precio AS sub_precio
        FROM turnos t
        LEFT JOIN servicios sv ON sv.id = t.servicio_id
        LEFT JOIN sub_servicios ss ON ss.id = t.subservicio_id
        WHERE t.id = :turno_id
      `, { replacements: { turno_id: p.turno_id } })

      if (turno) {
        montoTotal = parseFloat(turno.sub_precio || 0) > 0
          ? parseFloat(turno.sub_precio)
          : parseFloat(turno.servicio_precio || 0)
        console.log(`  [id=${p.id}] turno_id=${p.turno_id}: sub=${turno.sub_precio} base=${turno.servicio_precio} => $${montoTotal}`)
      }
    }

    if (montoTotal > 0) {
      const montoProfesional = parseFloat(((montoTotal * porcentaje) / 100).toFixed(2))
      await db.query(`
        UPDATE prestaciones
        SET monto_total = :mt, monto_profesional = :mp, porcentaje_profesional = :pct
        WHERE id = :id
      `, { replacements: { mt: montoTotal, mp: montoProfesional, pct: porcentaje, id: p.id } })
      console.log(`  ✅ id=${p.id}: monto_total=$${montoTotal} monto_prof=$${montoProfesional} (${porcentaje}%)`)
      f1actualizadas++
    } else {
      console.log(`  ⚠️  id=${p.id}: no se encontró precio`)
      f1sinPrecio++
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 2: prestaciones con monto_total > 0 donde la comisión aplicada
  //         no coincide con el porcentaje_comision actual del profesional
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n╔══════════════════════════════════════════════════════════════╗")
  console.log("║  FASE 2 – Recalcular comisión en prestaciones ya con precio  ║")
  console.log("╚══════════════════════════════════════════════════════════════╝\n")

  // Traer todas las prestaciones Pendiente no liquidadas con monto > 0
  const [fase2] = await db.query(`
    SELECT p.id, p.profesional_id, p.monto_total, p.monto_profesional, p.porcentaje_profesional,
           prof.porcentaje_comision
    FROM prestaciones p
    JOIN profesionales prof ON prof.id = p.profesional_id
    WHERE p.monto_total > 0
      AND p.estado = 'Pendiente'
      AND p.liquidacion_id IS NULL
    ORDER BY p.profesional_id, p.id ASC
  `)

  // Filtrar sólo las que tienen un % aplicado diferente al actual del profesional
  const aCorregir = fase2.filter(p => {
    const pctActual  = parseFloat(p.porcentaje_comision) || 50
    const pctGuardado = parseFloat(p.porcentaje_profesional) || 50
    // Tolerancia de 0.01 para evitar problemas de punto flotante
    return Math.abs(pctActual - pctGuardado) > 0.01
  })

  console.log(`📋 Prestaciones con comisión desactualizada: ${aCorregir.length} (de ${fase2.length} totales)\n`)

  if (aCorregir.length > 0) {
    // Mostrar resumen agrupado por profesional
    const porProf = {}
    for (const p of aCorregir) {
      const k = p.profesional_id
      if (!porProf[k]) porProf[k] = { porcentaje_comision: p.porcentaje_comision, count: 0, total: 0 }
      porProf[k].count++
      porProf[k].total += parseFloat(p.monto_total)
    }
    for (const [profId, info] of Object.entries(porProf)) {
      console.log(`  Profesional id=${profId}: ${info.count} prestaciones, comisión correcta=${info.porcentaje_comision}%`)
    }
    console.log("")
  }

  let f2actualizadas = 0
  for (const p of aCorregir) {
    const porcentaje = parseFloat(p.porcentaje_comision) || 50
    const montoTotal = parseFloat(p.monto_total)
    const montoProfesionalNuevo = parseFloat(((montoTotal * porcentaje) / 100).toFixed(2))
    const montoProfesionalViejo = parseFloat(p.monto_profesional)

    await db.query(`
      UPDATE prestaciones
      SET monto_profesional = :mp, porcentaje_profesional = :pct
      WHERE id = :id
    `, { replacements: { mp: montoProfesionalNuevo, pct: porcentaje, id: p.id } })

    console.log(
      `  ✅ id=${p.id}: monto_total=$${montoTotal}` +
      ` ${parseFloat(p.porcentaje_profesional)}%→${porcentaje}%` +
      ` monto_prof: $${montoProfesionalViejo}→$${montoProfesionalNuevo}`
    )
    f2actualizadas++
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Resumen final
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n═══════════════════════════════════════════════════")
  console.log("RESUMEN FINAL")
  console.log(`  Fase 1 (monto=$0) → actualizadas: ${f1actualizadas}  sin precio: ${f1sinPrecio}`)
  console.log(`  Fase 2 (comisión)  → corregidas:  ${f2actualizadas}`)
  console.log("═══════════════════════════════════════════════════\n")

  await db.close()
}

run().catch((err) => {
  console.error("❌ Error fatal:", err)
  process.exit(1)
})
