const { Turno, Paciente, Profesional, Servicio, SubServicio, ProfesionalServicio } = require("../models")
const { validationResult } = require("express-validator")
const { Op } = require("sequelize")

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

    // Verificar disponibilidad del profesional
    const turnoExistente = await Turno.findOne({
      where: {
        profesional_id: req.body.profesional_id,
        fecha: req.body.fecha,
        [Op.or]: [
          {
            hora_inicio: {
              [Op.between]: [req.body.hora_inicio, req.body.hora_fin],
            },
          },
          {
            hora_fin: {
              [Op.between]: [req.body.hora_inicio, req.body.hora_fin],
            },
          },
          {
            [Op.and]: [
              { hora_inicio: { [Op.lte]: req.body.hora_inicio } },
              { hora_fin: { [Op.gte]: req.body.hora_fin } },
            ],
          },
        ],
        estado: { [Op.ne]: "Cancelado" },
      },
    })

    if (turnoExistente) {
      return res.status(400).json({
        error: "El profesional ya tiene un turno asignado en ese horario",
      })
    }

    // Verificar restricción mensual: Un turno por mes por servicio para el paciente
    const fechaTurno = new Date(req.body.fecha)
    const primerDiaMes = new Date(fechaTurno.getFullYear(), fechaTurno.getMonth(), 1)
    const ultimoDiaMes = new Date(fechaTurno.getFullYear(), fechaTurno.getMonth() + 1, 0)

    const turnoMensualExistente = await Turno.findOne({
      where: {
        paciente_id: req.body.paciente_id,
        servicio_id: req.body.servicio_id,
        fecha: {
          [Op.between]: [primerDiaMes, ultimoDiaMes],
        },
        estado: { [Op.ne]: "Cancelado" },
      },
    })

    if (turnoMensualExistente) {
      return res.status(400).json({
        error: "Ya posee un turno reservado para esta prestación en este mes.",
      })
    }

    const turno = await Turno.create(req.body)

    const turnoCompleto = await Turno.findByPk(turno.id, {
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
    })

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

    const turnoExistente = await Turno.findOne({
      where: {
        profesional_id,
        fecha,
        [Op.or]: [
          {
            hora_inicio: {
              [Op.between]: [hora_inicio, hora_fin],
            },
          },
          {
            hora_fin: {
              [Op.between]: [hora_inicio, hora_fin],
            },
          },
          {
            [Op.and]: [{ hora_inicio: { [Op.lte]: hora_inicio } }, { hora_fin: { [Op.gte]: hora_fin } }],
          },
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
    const { confirmar } = req.body // true = confirm, false = reject

    const turno = await Turno.findByPk(id)
    if (!turno) {
      return res.status(404).json({ error: "Turno no encontrado" })
    }

    if (confirmar) {
      // Confirm payment
      await Turno.update(
        {
          pago_confirmado: true,
          estado: "Confirmado"
        },
        { where: { id } }
      )
    } else {
      // Reject payment
      await Turno.update(
        {
          pago_confirmado: false,
          estado: "Cancelado"
        },
        { where: { id } }
      )
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

module.exports = {
  listarTurnos,
  crearTurno,
  obtenerTurno,
  actualizarTurno,
  eliminarTurno,
  verificarDisponibilidad,
  confirmarPago,
}
