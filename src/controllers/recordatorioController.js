const { Turno, Paciente, Profesional, Servicio, ConfiguracionSistema } = require("../models")
const { enviarRecordatorioTurno, generarPreviewRecordatorio } = require("../services/emailService")
const { Op } = require("sequelize")

const enviarRecordatorioManual = async (req, res) => {
  try {
    const { turno_id, mensaje_personalizado } = req.body

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
    let template = mensaje_personalizado !== undefined ? mensaje_personalizado : null
    if (template === null) {
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

const previewRecordatorio = async (req, res) => {
  try {
    const { turno_id, custom_template } = req.body

    let turnoData
    if (turno_id) {
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
      turnoData = {
        paciente: turno.paciente,
        profesional: turno.profesional,
        servicio: turno.servicio,
        fecha: turno.fecha,
        hora_inicio: turno.hora_inicio,
        hora_fin: turno.hora_fin,
      }
    } else {
      // Use sample data for preview
      turnoData = {
        paciente: { nombre: "Juan", apellido: "Pérez" },
        profesional: { nombre: "Dra. María", apellido: "González", especialidad: "Odontología general" },
        servicio: { nombre: "Control general" },
        fecha: new Date().toISOString().split("T")[0],
        hora_inicio: "10:00",
        hora_fin: "10:30",
      }
    }

    // Use the provided template, or load saved one, or use default (null)
    let template = custom_template !== undefined ? custom_template : null
    if (template === null && !custom_template && custom_template !== "") {
      try {
        const config = await ConfiguracionSistema.findOne({
          where: { clave: "recordatorio_email_template" },
        })
        if (config) template = config.valor
      } catch (e) {}
    }

    // If custom_template is empty string, use default (null)
    if (template === "") template = null

    const html = generarPreviewRecordatorio(turnoData, template)
    res.json({ html })
  } catch (error) {
    console.error("Error al generar preview:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

// Cada canal de recordatorio guarda su propio template por defecto en ConfiguracionSistema.
const CLAVES_TEMPLATE = {
  email: "recordatorio_email_template",
  whatsapp: "recordatorio_whatsapp_template",
}

const resolverCanal = (valor) => (valor === "whatsapp" ? "whatsapp" : "email")

const obtenerTemplate = async (req, res) => {
  try {
    const canal = resolverCanal(req.query.canal)
    const config = await ConfiguracionSistema.findOne({
      where: { clave: CLAVES_TEMPLATE[canal] },
    })
    res.json({ template: config ? config.valor : "" })
  } catch (error) {
    console.error("Error al obtener template:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const guardarTemplate = async (req, res) => {
  try {
    const { template } = req.body
    const canal = resolverCanal(req.body.canal)
    const clave = CLAVES_TEMPLATE[canal]

    const [config, created] = await ConfiguracionSistema.findOrCreate({
      where: { clave },
      defaults: {
        clave,
        valor: template || "",
        tipo: "string",
        descripcion:
          canal === "whatsapp"
            ? "Template personalizado para el recordatorio de turno por WhatsApp"
            : "Template personalizado para el email de recordatorio de turno",
        categoria: "recordatorios",
      },
    })

    if (!created) {
      await config.update({ valor: template || "" })
    }

    res.json({ message: "Template guardado correctamente", template: template || "" })
  } catch (error) {
    console.error("Error al guardar template:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  enviarRecordatorioManual,
  enviarRecordatoriosMasivos,
  previewRecordatorio,
  obtenerTemplate,
  guardarTemplate,
}
