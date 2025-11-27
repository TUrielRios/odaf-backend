const {
  Paciente,
  ObraSocial,
  Odontograma,
  HistorialClinico,
  Prescripcion,
  PlanTratamiento,
  Archivo,
} = require("../models")
const { validationResult } = require("express-validator")
const { Op } = require("sequelize")

const listarPacientes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", condicion = "" } = req.query
    const offset = (page - 1) * limit

    const whereClause = {}

    if (search) {
      whereClause[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { apellido: { [Op.iLike]: `%${search}%` } },
        { numero_documento: { [Op.iLike]: `%${search}%` } },
      ]
    }

    if (condicion) {
      whereClause.condicion = condicion
    }

    const { count, rows } = await Paciente.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ObraSocial,
          as: "obraSocial",
        },
        {
          model: Odontograma,
          as: "odontogramas",
        },
        {
          model: HistorialClinico,
          as: "historialClinico",
        },
        {
          model: Prescripcion,
          as: "prescripciones",
        },
        {
          model: PlanTratamiento,
          as: "planesTratamiento",
          include: [
            {
              model: ObraSocial,
              as: "obraSocial",
            },
          ],
        },
        {
          model: Archivo,
          as: "archivos",
        },
      ],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [
        ["apellido", "ASC"],
        ["nombre", "ASC"],
      ],
    })

    res.json({
      pacientes: rows,
      pagination: {
        total: count,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    console.error("Error al listar pacientes:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const crearPaciente = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const paciente = await Paciente.create(req.body)

    const pacienteCompleto = await Paciente.findByPk(paciente.id, {
      include: [
        {
          model: ObraSocial,
          as: "obraSocial",
        },
      ],
    })

    res.status(201).json(pacienteCompleto)
  } catch (error) {
    console.error("Error al crear paciente:", error)

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "El número de documento ya existe" })
    }

    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerPaciente = async (req, res) => {
  try {
    const { id } = req.params

    const paciente = await Paciente.findByPk(id, {
      include: [
        {
          model: ObraSocial,
          as: "obraSocial",
        },
        {
          model: Odontograma,
          as: "odontogramas",
          order: [["fecha", "DESC"]],
        },
        {
          model: HistorialClinico,
          as: "historialClinico",
          order: [["fecha", "DESC"]],
        },
        {
          model: Prescripcion,
          as: "prescripciones",
          order: [["fecha", "DESC"]],
        },
        {
          model: PlanTratamiento,
          as: "planesTratamiento",
          include: [
            {
              model: ObraSocial,
              as: "obraSocial",
            },
          ],
        },
        {
          model: Archivo,
          as: "archivos",
          order: [["createdAt", "DESC"]],
        },
      ],
    })

    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" })
    }

    res.json(paciente)
  } catch (error) {
    console.error("Error al obtener paciente:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarPaciente = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params

    const [updatedRowsCount] = await Paciente.update(req.body, {
      where: { id },
    })

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" })
    }

    const pacienteActualizado = await Paciente.findByPk(id, {
      include: [
        {
          model: ObraSocial,
          as: "obraSocial",
        },
      ],
    })

    res.json(pacienteActualizado)
  } catch (error) {
    console.error("Error al actualizar paciente:", error)

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "El número de documento ya existe" })
    }

    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarPaciente = async (req, res) => {
  try {
    const { id } = req.params

    const deletedRowsCount = await Paciente.destroy({
      where: { id },
    })

    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" })
    }

    res.json({ message: "Paciente eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar paciente:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const buscarPorDocumento = async (req, res) => {
  try {
    const { numero_documento } = req.params

    const paciente = await Paciente.findOne({
      where: { numero_documento },
      include: [
        {
          model: ObraSocial,
          as: "obraSocial",
        },
      ],
    })

    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" })
    }

    res.json(paciente)
  } catch (error) {
    console.error("Error al buscar paciente por documento:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarPacientes,
  crearPaciente,
  obtenerPaciente,
  actualizarPaciente,
  eliminarPaciente,
  buscarPorDocumento,
}
