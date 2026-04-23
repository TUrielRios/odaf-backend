const { Paciente, Turno, Prestacion, Profesional, Servicio } = require("../src/models")
const { Op } = require("sequelize")

const profesionalId = 11 // Rolando Sánchez
const servicioId = 3 // Ortodoncia

const turnos = [
  { date: "2026-05-06", time: "09:00", patient: "Campos Lautaro Leonardo" },
  { date: "2026-05-06", time: "09:30", patient: "Villasboa Antonia" },
  { date: "2026-05-06", time: "10:00", patient: "Padilla Karen Andrea" },
  { date: "2026-05-06", time: "10:30", patient: "Campano Valentina" },
  { date: "2026-05-06", time: "11:00", patient: "Franques Samuel" },
  { date: "2026-05-06", time: "14:00", patient: "Rodriguez Sebastian" },
  { date: "2026-05-06", time: "14:30", patient: "Flores Lavinia Canela" },
  { date: "2026-05-06", time: "15:00", patient: "Rojas Josefina" },
  { date: "2026-05-06", time: "15:30", patient: "PACIENTE CONTROL" },
  { date: "2026-05-07", time: "08:00", patient: "PACIENTE CONTROL" },
  { date: "2026-05-12", time: "10:30", patient: "Adet Mariela" },
  { date: "2026-05-12", time: "11:00", patient: "Rojas Nahir Melina" },
  { date: "2026-05-12", time: "14:00", patient: "Lago Veronica" },
  { date: "2026-05-12", time: "15:00", patient: "Bermudez Ambar" },
  { date: "2026-05-12", time: "15:30", patient: "Oliveros Elena" },
  { date: "2026-05-12", time: "16:00", patient: "Cammareri Valentina" },
  { date: "2026-05-12", time: "17:00", patient: "Manavella Angel" },
  { date: "2026-05-12", time: "17:30", patient: "Campos Priscila" },
  { date: "2026-05-12", time: "18:00", patient: "Rojas Agustina Sol" },
  { date: "2026-05-12", time: "18:30", patient: "Alifraco Sofia Amanda" },
  { date: "2026-05-14", time: "08:00", patient: "Bensi Daniela" },
  { date: "2026-05-14", time: "10:00", patient: "Perez De Bolivar Miriam" },
  { date: "2026-05-14", time: "11:00", patient: "Galiano Jacqueline" },
  { date: "2026-05-14", time: "11:30", patient: "Jennifer Nazarena Lugo" },
  { date: "2026-05-14", time: "14:00", patient: "Chirino Brenda" },
  { date: "2026-05-14", time: "14:30", patient: "Flores Lucila Soledad" },
  { date: "2026-05-14", time: "15:00", patient: "Bautista Jairo Santino" },
  { date: "2026-05-14", time: "16:00", patient: "Vega Malena" },
  { date: "2026-05-14", time: "16:30", patient: "Guiot Paola Yanel" },
  { date: "2026-05-14", time: "17:00", patient: "Lezcano Lourdes Renata" },
  { date: "2026-05-14", time: "17:30", patient: "Almada Acosta Gimena" },
  { date: "2026-05-14", time: "17:30", patient: "Cuello Federico" },
  { date: "2026-05-14", time: "18:00", patient: "Canaveri Guillermo Leandro" },
  { date: "2026-05-19", time: "09:00", patient: "PACIENTE CONTROL" },
  { date: "2026-05-21", time: "12:00", patient: "Arias Milagros Agustina" },
  { date: "2026-05-21", time: "17:00", patient: "Yan Andy" },
  { date: "2026-05-21", time: "18:00", patient: "Yan Wendy Mia" },
]

async function migrate() {
  console.log(`Iniciando migración de ${turnos.length} turnos para Rolo Sánchez...`)

  const profesional = await Profesional.findByPk(profesionalId)
  const servicio = await Servicio.findByPk(servicioId)

  let createdCount = 0
  let skippedCount = 0

  for (const t of turnos) {
    try {
      // 1. Manejar paciente
      let patientObj
      if (t.patient === "PACIENTE CONTROL") {
        // Buscar o crear paciente genérico
        const [p] = await Paciente.findOrCreate({
          where: { numero_documento: "99999999" },
          defaults: {
            nombre: "CONTROL",
            apellido: "PACIENTE",
            tipo_documento: "DNI",
            numero_documento: "99999999",
            fecha_nacimiento: "2000-01-01",
            sexo: "Otro",
            estado: "Activo",
          },
        })
        patientObj = p
      } else {
        // Separar nombre y apellido (primer palabra como apellido, el resto como nombre)
        const parts = t.patient.split(" ")
        const apellido = parts[0].toUpperCase()
        const nombre = parts.slice(1).join(" ").toUpperCase() || "PACIENTE"

        // Buscar por nombre y apellido para evitar duplicados si no hay DNI
        let p = await Paciente.findOne({
          where: {
            [Op.and]: [
              { apellido: { [Op.iLike]: apellido } },
              { nombre: { [Op.iLike]: nombre } },
            ],
          },
        })

        if (!p) {
          // Generar un DNI ficticio único para no chocar
          const fakeDni = "MIG-" + Math.random().toString(36).substring(2, 9).toUpperCase()
          p = await Paciente.create({
            apellido,
            nombre,
            tipo_documento: "DNI",
            numero_documento: fakeDni,
            fecha_nacimiento: "2000-01-01",
            sexo: "Otro",
            estado: "Activo",
            observaciones: "Migrado de calendario imagen",
          })
        }
        patientObj = p
      }

      // 2. Calcular hora fin (30 min)
      const [h, m] = t.time.split(":").map(Number)
      const endMins = h * 60 + m + 30
      const endH = Math.floor(endMins / 60)
      const endM = endMins % 60
      const horaFin = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`

      // 3. Crear turno
      const [turno, created] = await Turno.findOrCreate({
        where: {
          profesional_id: profesionalId,
          fecha: t.date,
          hora_inicio: t.time,
        },
        defaults: {
          paciente_id: patientObj.id,
          servicio_id: servicioId,
          hora_fin: horaFin,
          estado: "Confirmado",
          pago_confirmado: false,
          observaciones: "Migración automática de calendario",
        },
      })

      if (created) {
        // 4. Crear prestación
        const monto = parseFloat(servicio.precio_base)
        const porcentaje = profesional.porcentaje_comision || 50
        await Prestacion.create({
          turno_id: turno.id,
          profesional_id: profesionalId,
          paciente_id: patientObj.id,
          servicio_id: servicioId,
          fecha: t.date,
          monto_total: monto,
          porcentaje_profesional: porcentaje,
          monto_profesional: (monto * porcentaje) / 100,
          estado: "Pendiente",
        })
        createdCount++
      } else {
        skippedCount++
      }
    } catch (error) {
      console.error(`Error procesando turno ${t.date} ${t.time}:`, error.message)
    }
  }

  console.log(`\nMigración finalizada:`)
  console.log(`- Creados: ${createdCount}`)
  console.log(`- Saltados (ya existían): ${skippedCount}`)
}

migrate()
