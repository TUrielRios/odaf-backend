const { Odontograma, Paciente, Profesional } = require("../models")
const { validationResult } = require("express-validator")

const listarOdontogramas = async (req, res) => {
  try {
    const { paciente_id, profesional_id, tipo } = req.query

    const whereClause = {}

    if (paciente_id) {
      whereClause.paciente_id = paciente_id
    }

    if (profesional_id) {
      whereClause.profesional_id = profesional_id
    }

    if (tipo) {
      whereClause.tipo = tipo
    }

    const odontogramas = await Odontograma.findAll({
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

    res.json(odontogramas)
  } catch (error) {
    console.error("Error al listar odontogramas:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const crearOdontograma = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const odontograma = await Odontograma.create(req.body)

    const odontogramaCompleto = await Odontograma.findByPk(odontograma.id, {
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

    res.status(201).json(odontogramaCompleto)
  } catch (error) {
    console.error("Error al crear odontograma:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerOdontograma = async (req, res) => {
  try {
    const { id } = req.params

    const odontograma = await Odontograma.findByPk(id, {
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

    if (!odontograma) {
      return res.status(404).json({ error: "Odontograma no encontrado" })
    }

    res.json(odontograma)
  } catch (error) {
    console.error("Error al obtener odontograma:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarOdontograma = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params

    const [updatedRowsCount] = await Odontograma.update(req.body, {
      where: { id },
    })

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Odontograma no encontrado" })
    }

    const odontogramaActualizado = await Odontograma.findByPk(id, {
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

    res.json(odontogramaActualizado)
  } catch (error) {
    console.error("Error al actualizar odontograma:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarOdontograma = async (req, res) => {
  try {
    const { id } = req.params

    const deletedRowsCount = await Odontograma.destroy({
      where: { id },
    })

    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: "Odontograma no encontrado" })
    }

    res.json({ message: "Odontograma eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar odontograma:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarOdontogramas,
  crearOdontograma,
  obtenerOdontograma,
  actualizarOdontograma,
  eliminarOdontograma,
}
