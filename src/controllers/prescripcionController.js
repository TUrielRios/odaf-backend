const { Prescripcion, Paciente, Profesional } = require("../models")
const { validationResult } = require("express-validator")

const listarPrescripciones = async (req, res) => {
  try {
    const { paciente_id, profesional_id, estado } = req.query

    const whereClause = {}

    if (paciente_id) {
      whereClause.paciente_id = paciente_id
    }

    if (profesional_id) {
      whereClause.profesional_id = profesional_id
    }

    if (estado) {
      whereClause.estado = estado
    }

    const prescripciones = await Prescripcion.findAll({
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

    res.json(prescripciones)
  } catch (error) {
    console.error("Error al listar prescripciones:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const crearPrescripcion = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const prescripcion = await Prescripcion.create(req.body)

    const prescripcionCompleta = await Prescripcion.findByPk(prescripcion.id, {
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

    res.status(201).json(prescripcionCompleta)
  } catch (error) {
    console.error("Error al crear prescripción:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerPrescripcion = async (req, res) => {
  try {
    const { id } = req.params

    const prescripcion = await Prescripcion.findByPk(id, {
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

    if (!prescripcion) {
      return res.status(404).json({ error: "Prescripción no encontrada" })
    }

    res.json(prescripcion)
  } catch (error) {
    console.error("Error al obtener prescripción:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarPrescripcion = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params

    const [updatedRowsCount] = await Prescripcion.update(req.body, {
      where: { id },
    })

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Prescripción no encontrada" })
    }

    const prescripcionActualizada = await Prescripcion.findByPk(id, {
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

    res.json(prescripcionActualizada)
  } catch (error) {
    console.error("Error al actualizar prescripción:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarPrescripcion = async (req, res) => {
  try {
    const { id } = req.params

    const deletedRowsCount = await Prescripcion.destroy({
      where: { id },
    })

    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: "Prescripción no encontrada" })
    }

    res.json({ message: "Prescripción eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar prescripción:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarPrescripciones,
  crearPrescripcion,
  obtenerPrescripcion,
  actualizarPrescripcion,
  eliminarPrescripcion,
}
