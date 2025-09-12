const { Profesional } = require("../models")
const { validationResult } = require("express-validator")
const { Op } = require("sequelize")

const listarProfesionales = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", estado = "" } = req.query
    const offset = (page - 1) * limit

    const whereClause = {}

    if (search) {
      whereClause[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { apellido: { [Op.iLike]: `%${search}%` } },
        { numero_matricula: { [Op.iLike]: `%${search}%` } },
        { especialidad: { [Op.iLike]: `%${search}%` } },
      ]
    }

    if (estado) {
      whereClause.estado = estado
    }

    const { count, rows } = await Profesional.findAndCountAll({
      where: whereClause,
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [
        ["apellido", "ASC"],
        ["nombre", "ASC"],
      ],
    })

    res.json({
      profesionales: rows,
      pagination: {
        total: count,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    console.error("Error al listar profesionales:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const crearProfesional = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const profesional = await Profesional.create(req.body)
    res.status(201).json(profesional)
  } catch (error) {
    console.error("Error al crear profesional:", error)

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        error: "El número de documento o matrícula ya existe",
      })
    }

    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerProfesional = async (req, res) => {
  try {
    const { id } = req.params

    const profesional = await Profesional.findByPk(id)

    if (!profesional) {
      return res.status(404).json({ error: "Profesional no encontrado" })
    }

    res.json(profesional)
  } catch (error) {
    console.error("Error al obtener profesional:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarProfesional = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params

    const [updatedRowsCount] = await Profesional.update(req.body, {
      where: { id },
    })

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Profesional no encontrado" })
    }

    const profesionalActualizado = await Profesional.findByPk(id)
    res.json(profesionalActualizado)
  } catch (error) {
    console.error("Error al actualizar profesional:", error)

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        error: "El número de documento o matrícula ya existe",
      })
    }

    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarProfesional = async (req, res) => {
  try {
    const { id } = req.params

    const deletedRowsCount = await Profesional.destroy({
      where: { id },
    })

    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: "Profesional no encontrado" })
    }

    res.json({ message: "Profesional eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar profesional:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerHorariosProfesional = async (req, res) => {
  try {
    const { id } = req.params

    const profesional = await Profesional.findByPk(id)

    if (!profesional) {
      return res.status(404).json({ error: "Profesional no encontrado" })
    }

    // Horarios por defecto - esto se puede personalizar según las necesidades
    const horarios = {
      lunes: { inicio: "08:00", fin: "17:00", activo: true },
      martes: { inicio: "08:00", fin: "17:00", activo: true },
      miercoles: { inicio: "08:00", fin: "17:00", activo: true },
      jueves: { inicio: "08:00", fin: "17:00", activo: true },
      viernes: { inicio: "08:00", fin: "17:00", activo: true },
      sabado: { inicio: "09:00", fin: "13:00", activo: false },
      domingo: { inicio: "00:00", fin: "00:00", activo: false },
    }

    res.json({
      profesional_id: id,
      horarios: horarios,
    })
  } catch (error) {
    console.error("Error al obtener horarios del profesional:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarProfesionales,
  crearProfesional,
  obtenerProfesional,
  actualizarProfesional,
  eliminarProfesional,
  obtenerHorariosProfesional, // Added to exports
}
