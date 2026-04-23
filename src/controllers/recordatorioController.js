const { Turno, Paciente, Profesional, Servicio, ConfiguracionSistema } = require("../models")
const { enviarRecordatorioTurno } = require("../services/emailService")
const { Op } = require("sequelize")

const enviarRecordatorioManual = async (req, res) => {
  try {
    const { turno_id } = req.body

    const turno = await Turno.findByPk(turno_id, {
      include: [
        { model: Paciente, as: "paciente" },
        { model: Profesional, as: "profesional" },
        { model: Servicio, as: "servicio" },
      ],
    })

    if (!turno) {
      return res.status(404).json({ error: "Turno no encontrado" })
    }

    if (!turno.paciente?.email) {
      return res.status(400).json({ error: "El paciente no tiene email registrado" })
    }

    // Obtener template personalizado si existe
    let template = null
    try {
      const config = await ConfiguracionSistema.findOne({
        where: { clave: "recordatorio_email_template" },
      })
      if (config) {
        template = config.valor
      }
    } catch (e) {
      // Si no existe la config, usar template por defecto
    }

    const result = await enviarRecordatorioTurno(
      {
        paciente: turno.paciente,
        profesional: turno.profesional,
        servicio: turno.servicio,
        fecha: turno.fecha,
        hora_inicio: turno.hora_inicio,
        hora_fin: turno.hora_fin,
        turnoId: turno.id,
      },
      turno.paciente.email,
      template,
    )

    if (result.success) {
      res.json({ message: "Recordatorio enviado correctamente", messageId: result.messageId })
    } else {
      res.status(500).json({ error: "Error al enviar recordatorio", detail: result.error })
    }
  } catch (error) {
    console.error("Error al enviar recordatorio manual:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const enviarRecordatoriosMasivos = async (req, res) => {
  try {
    const { fecha } = req.body

    if (!fecha) {
      return res.status(400).json({ error: "La fecha es requerida" })
    }

    const turnos = await Turno.findAll({
      where: {
        fecha,
        estado: { [Op.in]: ["Pendiente", "Confirmado"] },
      },
      include: [
        { model: Paciente, as: "paciente" },
        { model: Profesional, as: "profesional" },
        { model: Servicio, as: "servicio" },
      ],
    })

    // Obtener template personalizado
    let template = null
    try {
      const config = await ConfiguracionSistema.findOne({
        where: { clave: "recordatorio_email_template" },
      })
      if (config) template = config.valor
    } catch (e) {}

    let enviados = 0
    let errores = 0

    for (const turno of turnos) {
      if (!turno.paciente?.email) {
        errores++
        continue
      }

      const result = await enviarRecordatorioTurno(
        {
          paciente: turno.paciente,
          profesional: turno.profesional,
          servicio: turno.servicio,
          fecha: turno.fecha,
          hora_inicio: turno.hora_inicio,
          hora_fin: turno.hora_fin,
          turnoId: turno.id,
        },
        turno.paciente.email,
        template,
      )

      if (result.success) {
        enviados++
      } else {
        errores++
      }
    }

    res.json({
      message: `Recordatorios procesados: ${enviados} enviados, ${errores} con error, de ${turnos.length} turnos`,
      enviados,
      errores,
      total: turnos.length,
    })
  } catch (error) {
    console.error("Error al enviar recordatorios masivos:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  enviarRecordatorioManual,
  enviarRecordatoriosMasivos,
}
