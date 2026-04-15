const { Turno, Paciente, Profesional, Servicio, SubServicio, ProfesionalServicio, Prestacion, UsuarioPaciente } = require("../models")
const { validationResult } = require("express-validator")
const { Op } = require("sequelize")
const jwt = require("jsonwebtoken")
const { enviarConfirmacionTurno, enviarCancelacionTurno, enviarReprogramacionTurno } = require("../services/emailService")
const { enviarConfirmacionTurnoWhatsApp } = require("../services/whatsappNotifications")
const bcrypt = require("bcryptjs")

const listarTurnos = async (req, res) => {
  try {
    const { page = 1, limit = 10, fecha_desde, fecha_hasta, profesional_id, estado, paciente_id } = req.query
    const offset = (page - 1) * limit

    const whereClause = {}

    if (fecha_desde && fecha_hasta) {
      whereClause.fecha = {
        [Op.between]: [fecha_desde, fecha_hasta],
      }
    } else if (fecha_desde) {
      whereClause.fecha = {
        [Op.gte]: fecha_desde,
      }
    } else if (fecha_hasta) {
      whereClause.fecha = {
        [Op.lte]: fecha_hasta,
      }
    }

    if (profesional_id) {
      whereClause.profesional_id = profesional_id
    }

    if (estado) {
      whereClause.estado = estado
    }

    if (paciente_id) {
      whereClause.paciente_id = paciente_id
    }

    const { count, rows } = await Turno.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Paciente,
          as: "paciente",
          attributes: ["id", "nombre", "apellido", "numero_documento"],
        },
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido", "especialidad", "color"],
        },
        {
          model: Servicio,
          as: "servicio",
          attributes: ["id", "nombre", "precio_base"],
        },
        {
          model: SubServicio,
          as: "subservicio",
          attributes: ["id", "nombre", "precio"],
        },
      ],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [
        ["fecha", "ASC"],
        ["hora_inicio", "ASC"],
      ],
    })

    res.json({
      turnos: rows,
      pagination: {
        total: count,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    console.error("Error al listar turnos:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const crearTurno = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    if (req.body.servicio_id && req.body.profesional_id) {
      const relacionServicio = await ProfesionalServicio.findOne({
        where: {
          profesional_id: req.body.profesional_id,
          servicio_id: req.body.servicio_id,
          estado: "Activo",
        },
      })

      if (!relacionServicio) {
        return res.status(400).json({
          error: "El profesional seleccionado no está disponible para este servicio",
        })
      }
    }

    // Si se envía sobre_turno: true, saltamos las validaciones de superposición y límites
    if (!req.body.sobre_turno) {
      // Verificar disponibilidad del profesional
      const turnoExistente = await Turno.findOne({
        where: {
          profesional_id: req.body.profesional_id,
          fecha: req.body.fecha,
          [Op.and]: [
            { hora_inicio: { [Op.lt]: req.body.hora_fin } },
            { hora_fin: { [Op.gt]: req.body.hora_inicio } },
          ],
          estado: { [Op.ne]: "Cancelado" },
        },
      })

      if (turnoExistente) {
        return res.status(400).json({
          error: "El profesional ya tiene un turno asignado en ese horario",
        })
      }

      // Verificar restricción mensual: Un turno por mes para el paciente (global)
      const [year, month] = req.body.fecha.split("-")
      const primerDiaMes = `${year}-${month}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const ultimoDiaMes = `${year}-${month}-${lastDay}`

      const turnoMensualExistente = await Turno.findOne({
        where: {
          paciente_id: req.body.paciente_id,
          fecha: {
            [Op.between]: [primerDiaMes, ultimoDiaMes],
          },
          estado: { [Op.ne]: "Cancelado" },
        },
      })

      if (turnoMensualExistente) {
        return res.status(400).json({
          error: "El paciente ya posee un turno reservado en este mes.",
        })
      }
    }

    const turno = await Turno.create(req.body)

    const turnoCompleto = await Turno.findByPk(turno.id, {
      include: [
        {
          model: Paciente,
          as: "paciente",
          attributes: ["id", "nombre", "apellido", "numero_documento", "email"],
        },
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido", "especialidad", "color"],
        },
        {
          model: Servicio,
          as: "servicio",
          attributes: ["id", "nombre", "precio_base"],
        },
        {
          model: SubServicio,
          as: "subservicio",
          attributes: ["id", "nombre", "precio"],
        },
      ],
    })

    // Crear usuario paciente automaticamente si no existe
    if (turnoCompleto.paciente && turnoCompleto.paciente.email && turnoCompleto.paciente.numero_documento) {
      const usuarioExistente = await UsuarioPaciente.findOne({
        where: { email: turnoCompleto.paciente.email },
      })

      if (!usuarioExistente) {
        const hashedDni = await bcrypt.hash(turnoCompleto.paciente.numero_documento, 10)
        await UsuarioPaciente.create({
          email: turnoCompleto.paciente.email,
          dni_hash: hashedDni,
          paciente_id: turnoCompleto.paciente_id,
        })
        console.log("Usuario paciente creado automaticamente para:", turnoCompleto.paciente.email)
      }

      // Enviar email de confirmacion
      enviarConfirmacionTurno(
        {
          paciente: turnoCompleto.paciente,
          profesional: turnoCompleto.profesional,
          servicio: turnoCompleto.servicio,
          fecha: turnoCompleto.fecha,
          hora_inicio: turnoCompleto.hora_inicio,
          hora_fin: turnoCompleto.hora_fin,
          turnoId: turno.id,
        },
        turnoCompleto.paciente.email
      ).catch((error) => {
        console.error("No se pudo enviar email de confirmacion:", error)
      })
    }

    // Enviar notificación de WhatsApp (no bloqueante)
    if (turnoCompleto.paciente && turnoCompleto.paciente.telefono) {
      enviarConfirmacionTurnoWhatsApp({
        telefono: turnoCompleto.paciente.telefono,
        paciente_nombre: turnoCompleto.paciente.nombre,
        paciente_apellido: turnoCompleto.paciente.apellido,
        servicio_nombre: turnoCompleto.servicio.nombre,
        profesional_nombre: turnoCompleto.profesional.nombre,
        profesional_apellido: turnoCompleto.profesional.apellido,
        fecha: turnoCompleto.fecha,
        hora_inicio: turnoCompleto.hora_inicio,
        hora_fin: turnoCompleto.hora_fin,
      }).catch((error) => {
        console.error("No se pudo enviar WhatsApp de confirmación:", error)
        // No fallar la creación del turno si el WhatsApp falla
      })
    }

    res.status(201).json(turnoCompleto)
  } catch (error) {
    console.error("Error al crear turno:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerTurno = async (req, res) => {
  try {
    const { id } = req.params

    const turno = await Turno.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: "paciente",
        },
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido", "especialidad", "color"],
        },
        {
          model: Servicio,
          as: "servicio",
        },
        {
          model: SubServicio,
          as: "subservicio",
        },
      ],
    })

    if (!turno) {
      return res.status(404).json({ error: "Turno no encontrado" })
    }

    res.json(turno)
  } catch (error) {
    console.error("Error al obtener turno:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarTurno = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params

    const [updatedRowsCount] = await Turno.update(req.body, {
      where: { id },
    })

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Turno no encontrado" })
    }

    // Check if status changed to "Atendido" or any "Confirmado" variant
    const estadosGeneradoresPrestacion = [
      "Atendido",
      "Confirmado",
      "Confirmado por email",
      "Confirmado por SMS",
      "Confirmado por Whatsapp"
    ];

    if (estadosGeneradoresPrestacion.includes(req.body.estado)) {
      const turno = await Turno.findByPk(id)
      const existingPrestacion = await Prestacion.findOne({
        where: { turno_id: id }
      })

      if (!existingPrestacion) {
        const profesional = await Profesional.findByPk(turno.profesional_id)
        const servicio = await Servicio.findByPk(turno.servicio_id)
        const subservicio = turno.subservicio_id ? await SubServicio.findByPk(turno.subservicio_id) : null

        const montoTotal = (turno.precio_final !== null && turno.precio_final !== undefined)
          ? turno.precio_final
          : (subservicio ? subservicio.precio : servicio.precio_base)

        const porcentaje = profesional.porcentaje_comision || 50

        await Prestacion.create({
          turno_id: id,
          profesional_id: turno.profesional_id,
          paciente_id: turno.paciente_id,
          servicio_id: turno.servicio_id,
          subservicio_id: turno.subservicio_id,
          fecha: turno.fecha,
          monto_total: montoTotal,
          porcentaje_profesional: porcentaje,
          monto_profesional: (montoTotal * porcentaje) / 100,
          estado: "Pendiente"
        })
      }
    }

    const turnoActualizado = await Turno.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: "paciente",
          attributes: ["id", "nombre", "apellido", "numero_documento"],
        },
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido", "especialidad"],
        },
        {
          model: Servicio,
          as: "servicio",
          attributes: ["id", "nombre", "precio_base"],
        },
        {
          model: SubServicio,
          as: "subservicio",
          attributes: ["id", "nombre", "precio"],
        },
      ],
    })

    res.json(turnoActualizado)
  } catch (error) {
    console.error("Error al actualizar turno:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarTurno = async (req, res) => {
  try {
    const { id } = req.params

    const deletedRowsCount = await Turno.destroy({
      where: { id },
    })

    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: "Turno no encontrado" })
    }

    res.json({ message: "Turno eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar turno:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const verificarDisponibilidad = async (req, res) => {
  try {
    const { profesional_id, fecha, hora_inicio, hora_fin } = req.query

    if (!profesional_id || !fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        error: "Faltan parámetros requeridos: profesional_id, fecha, hora_inicio, hora_fin",
      })
    }

    // Verificar si hay solapamiento de horarios
    // Dos turnos se solapan si: nuevo_inicio < existente_fin AND nuevo_fin > existente_inicio
    const turnoExistente = await Turno.findOne({
      where: {
        profesional_id,
        fecha,
        [Op.and]: [
          { hora_inicio: { [Op.lt]: hora_fin } },
          { hora_fin: { [Op.gt]: hora_inicio } },
        ],
        estado: { [Op.ne]: "Cancelado" },
      },
    })

    res.json({
      disponible: !turnoExistente,
      mensaje: turnoExistente ? "El profesional ya tiene un turno asignado en ese horario" : "Horario disponible",
    })
  } catch (error) {
    console.error("Error al verificar disponibilidad:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const confirmarPago = async (req, res) => {
  try {
    const { id } = req.params
    const { confirmar } = req.body

    const turno = await Turno.findByPk(id)
    if (!turno) {
      return res.status(404).json({ error: "Turno no encontrado" })
    }

    if (confirmar) {
      await Turno.update(
        {
          pago_confirmado: true,
          estado: "Confirmado por email"
        },
        { where: { id } }
      )

      const existingPrestacion = await Prestacion.findOne({
        where: { turno_id: id }
      })

      if (!existingPrestacion) {
        const profesional = await Profesional.findByPk(turno.profesional_id)
        const servicio = await Servicio.findByPk(turno.servicio_id)
        const subservicio = turno.subservicio_id ? await SubServicio.findByPk(turno.subservicio_id) : null

        const montoTotal = (turno.precio_final !== null && turno.precio_final !== undefined)
          ? turno.precio_final
          : (subservicio ? subservicio.precio : servicio.precio_base)

        const porcentaje = profesional.porcentaje_comision || 50

        await Prestacion.create({
          turno_id: id,
          profesional_id: turno.profesional_id,
          paciente_id: turno.paciente_id,
          servicio_id: turno.servicio_id,
          subservicio_id: turno.subservicio_id,
          fecha: turno.fecha,
          monto_total: montoTotal,
          porcentaje_profesional: porcentaje,
          monto_profesional: (montoTotal * porcentaje) / 100,
          estado: "Pendiente"
        })
      }

    } else {
      await Turno.update(
        {
          pago_confirmado: false,
          estado: "Cancelado"
        },
        { where: { id } }
      )

      await Prestacion.destroy({
        where: { turno_id: id, liquidacion_id: null }
      })
    }

    const turnoActualizado = await Turno.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: "paciente",
          attributes: ["id", "nombre", "apellido", "numero_documento"],
        },
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido", "especialidad", "color"],
        },
        {
          model: Servicio,
          as: "servicio",
          attributes: ["id", "nombre", "precio_base"],
        },
      ],
    })

    res.json({
      message: confirmar ? "Pago confirmado" : "Pago rechazado",
      turno: turnoActualizado
    })
  } catch (error) {
    console.error("Error al confirmar pago:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const misTurnos = async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")
    let pacienteId = req.user?.pacienteId
    
    if (!pacienteId && token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "dental_clinic_secret")
        pacienteId = decoded.pacienteId
      } catch (e) {}
    }
    
    if (!pacienteId) {
      return res.status(401).json({ error: "No autenticado" })
    }

    const turnos = await Turno.findAll({
      where: { paciente_id: pacienteId },
      include: [
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido", "especialidad"],
        },
        {
          model: Servicio,
          as: "servicio",
          attributes: ["id", "nombre"],
        },
      ],
      order: [
        ["fecha", "DESC"],
        ["hora_inicio", "DESC"],
      ],
    })

    res.json(turnos)
  } catch (error) {
    console.error("Error al obtener turnos del paciente:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const cancelarTurno = async (req, res) => {
  try {
    const { id } = req.params
    const pacienteId = req.user.pacienteId

    const turno = await Turno.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: "paciente",
        },
        {
          model: Profesional,
          as: "profesional",
        },
        {
          model: Servicio,
          as: "servicio",
        },
      ],
    })

    if (!turno) {
      return res.status(404).json({ error: "Turno no encontrado" })
    }

    if (turno.paciente_id !== pacienteId) {
      return res.status(403).json({ error: "No tienes permiso para cancelar este turno" })
    }

    if (turno.estado === "Cancelado") {
      return res.status(400).json({ error: "Este turno ya esta cancelado" })
    }

    if (turno.estado === "Atendido") {
      return res.status(400).json({ error: "No se puede cancelar un turno ya atendido" })
    }

    await Turno.update({ estado: "Cancelado" }, { where: { id } })

    enviarCancelacionTurno(
      {
        paciente: turno.paciente,
        profesional: turno.profesional,
        servicio: turno.servicio,
        fecha: turno.fecha,
        hora_inicio: turno.hora_inicio,
      },
      turno.paciente.email
    ).catch((error) => {
      console.error("Error al enviar email de cancelacion:", error)
    })

    res.json({ message: "Turno cancelado exitosamente" })
  } catch (error) {
    console.error("Error al cancelar turno:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const reprogramarTurno = async (req, res) => {
  try {
    const { id } = req.params
    const { fecha, hora_inicio, hora_fin } = req.body
    const pacienteId = req.user.pacienteId

    const turno = await Turno.findByPk(id, {
      include: [
        { model: Paciente, as: "paciente" },
        { model: Profesional, as: "profesional" },
        { model: Servicio, as: "servicio" },
      ],
    })

    if (!turno) {
      return res.status(404).json({ error: "Turno no encontrado" })
    }

    if (turno.paciente_id !== pacienteId) {
      return res.status(403).json({ error: "No tienes permiso para reprogramar este turno" })
    }

    if (turno.estado === "Cancelado") {
      return res.status(400).json({ error: "No se puede reprogramar un turno cancelado" })
    }

    if (turno.estado === "Atendido") {
      return res.status(400).json({ error: "No se puede reprogramar un turno ya atendido" })
    }

    const fechaAnterior = turno.fecha

    const turnoExistente = await Turno.findOne({
      where: {
        profesional_id: turno.profesional_id,
        id: { [Op.ne]: id },
        fecha,
        [Op.and]: [
          { hora_inicio: { [Op.lt]: hora_fin } },
          { hora_fin: { [Op.gt]: hora_inicio } },
        ],
        estado: { [Op.ne]: "Cancelado" },
      },
    })

    if (turnoExistente) {
      return res.status(400).json({
        error: "El profesional ya tiene un turno asignado en ese horario",
      })
    }

    await Turno.update(
      { fecha, hora_inicio, hora_fin },
      { where: { id } }
    )

    const turnoActualizado = await Turno.findByPk(id, {
      include: [
        { model: Profesional, as: "profesional" },
        { model: Servicio, as: "servicio" },
      ],
    })

    enviarReprogramacionTurno(
      {
        paciente: turno.paciente,
        profesional: turnoActualizado.profesional,
        servicio: turnoActualizado.servicio,
        fecha,
        hora_inicio,
        hora_fin,
        turnoId: id,
      },
      turno.paciente.email,
      fechaAnterior
    ).catch((error) => {
      console.error("Error al enviar email de reprogramacion:", error)
    })

    res.json({
      message: "Turno reprogramado exitosamente",
      turno: turnoActualizado,
    })
  } catch (error) {
    console.error("Error al reprogramar turno:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarTurnos,
  crearTurno,
  obtenerTurno,
  actualizarTurno,
  eliminarTurno,
  verificarDisponibilidad,
  confirmarPago,
  misTurnos,
  cancelarTurno,
  reprogramarTurno,
}
