const { Presupuesto, Paciente, Profesional } = require("../models")
const { validationResult } = require("express-validator")

const listarPresupuestos = async (req, res) => {
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

    const presupuestos = await Presupuesto.findAll({
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
      order: [["fecha", "DESC"], ["createdAt", "DESC"]],
    })

    res.json(presupuestos)
  } catch (error) {
    console.error("Error al listar presupuestos:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const crearPresupuesto = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const presupuesto = await Presupuesto.create(req.body)

    const presupuestoCompleto = await Presupuesto.findByPk(presupuesto.id, {
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

    res.status(201).json(presupuestoCompleto)
  } catch (error) {
    console.error("Error al crear presupuesto:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerPresupuesto = async (req, res) => {
  try {
    const { id } = req.params

    const presupuesto = await Presupuesto.findByPk(id, {
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

    if (!presupuesto) {
      return res.status(404).json({ error: "Presupuesto no encontrado" })
    }

    res.json(presupuesto)
  } catch (error) {
    console.error("Error al obtener presupuesto:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarPresupuesto = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params

    const [updatedRowsCount] = await Presupuesto.update(req.body, {
      where: { id },
    })

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Presupuesto no encontrado" })
    }

    const presupuestoActualizado = await Presupuesto.findByPk(id, {
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

    res.json(presupuestoActualizado)
  } catch (error) {
    console.error("Error al actualizar presupuesto:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarPresupuesto = async (req, res) => {
  try {
    const { id } = req.params

    const deletedRowsCount = await Presupuesto.destroy({
      where: { id },
    })

    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: "Presupuesto no encontrado" })
    }

    res.json({ message: "Presupuesto eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar presupuesto:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarPresupuestos,
  crearPresupuesto,
  obtenerPresupuesto,
  actualizarPresupuesto,
  eliminarPresupuesto,
}
