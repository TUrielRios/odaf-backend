const { HistorialClinico, Paciente, Profesional } = require("../models")
const { validationResult } = require("express-validator")
const { Op } = require("sequelize") // Import Op from sequelize

const listarHistorialesClinico = async (req, res) => {
  try {
    const { paciente_id, profesional_id, fecha_desde, fecha_hasta } = req.query

    const whereClause = {}

    if (paciente_id) {
      whereClause.paciente_id = paciente_id
    }

    if (profesional_id) {
      whereClause.profesional_id = profesional_id
    }

    if (fecha_desde && fecha_hasta) {
      whereClause.fecha = {
        [Op.between]: [fecha_desde, fecha_hasta],
      }
    }

    const historiales = await HistorialClinico.findAll({
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
          attributes: ["id", "nombre", "apellido", "especialidad"],
        },
      ],
      order: [["fecha", "DESC"]],
    })

    res.json(historiales)
  } catch (error) {
    console.error("Error al listar historiales clínicos:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const crearHistorialClinico = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const historial = await HistorialClinico.create(req.body)

    const historialCompleto = await HistorialClinico.findByPk(historial.id, {
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
      ],
    })

    res.status(201).json(historialCompleto)
  } catch (error) {
    console.error("Error al crear historial clínico:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerHistorialClinico = async (req, res) => {
  try {
    const { id } = req.params

    const historial = await HistorialClinico.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: "paciente",
        },
        {
          model: Profesional,
          as: "profesional",
        },
      ],
    })

    if (!historial) {
      return res.status(404).json({ error: "Historial clínico no encontrado" })
    }

    res.json(historial)
  } catch (error) {
    console.error("Error al obtener historial clínico:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarHistorialClinico = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params

    const [updatedRowsCount] = await HistorialClinico.update(req.body, {
      where: { id },
    })

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Historial clínico no encontrado" })
    }

    const historialActualizado = await HistorialClinico.findByPk(id, {
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
      ],
    })

    res.json(historialActualizado)
  } catch (error) {
    console.error("Error al actualizar historial clínico:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarHistorialClinico = async (req, res) => {
  try {
    const { id } = req.params

    const deletedRowsCount = await HistorialClinico.destroy({
      where: { id },
    })

    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: "Historial clínico no encontrado" })
    }

    res.json({ message: "Historial clínico eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar historial clínico:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarHistorialesClinico,
  crearHistorialClinico,
  obtenerHistorialClinico,
  actualizarHistorialClinico,
  eliminarHistorialClinico,
}
