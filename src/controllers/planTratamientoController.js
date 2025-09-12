const { PlanTratamiento, Paciente, Profesional, ObraSocial } = require("../models")
const { validationResult } = require("express-validator")

const listarPlanesTratamiento = async (req, res) => {
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

    const planes = await PlanTratamiento.findAll({
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
        {
          model: ObraSocial,
          as: "obraSocial",
          attributes: ["id", "nombre", "plan"],
        },
      ],
      order: [["fecha_creacion", "DESC"]],
    })

    res.json(planes)
  } catch (error) {
    console.error("Error al listar planes de tratamiento:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const crearPlanTratamiento = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const plan = await PlanTratamiento.create(req.body)

    const planCompleto = await PlanTratamiento.findByPk(plan.id, {
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
          model: ObraSocial,
          as: "obraSocial",
          attributes: ["id", "nombre", "plan"],
        },
      ],
    })

    res.status(201).json(planCompleto)
  } catch (error) {
    console.error("Error al crear plan de tratamiento:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerPlanTratamiento = async (req, res) => {
  try {
    const { id } = req.params

    const plan = await PlanTratamiento.findByPk(id, {
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
          model: ObraSocial,
          as: "obraSocial",
        },
      ],
    })

    if (!plan) {
      return res.status(404).json({ error: "Plan de tratamiento no encontrado" })
    }

    res.json(plan)
  } catch (error) {
    console.error("Error al obtener plan de tratamiento:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarPlanTratamiento = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params

    const [updatedRowsCount] = await PlanTratamiento.update(req.body, {
      where: { id },
    })

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Plan de tratamiento no encontrado" })
    }

    const planActualizado = await PlanTratamiento.findByPk(id, {
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
          model: ObraSocial,
          as: "obraSocial",
          attributes: ["id", "nombre", "plan"],
        },
      ],
    })

    res.json(planActualizado)
  } catch (error) {
    console.error("Error al actualizar plan de tratamiento:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarPlanTratamiento = async (req, res) => {
  try {
    const { id } = req.params

    const deletedRowsCount = await PlanTratamiento.destroy({
      where: { id },
    })

    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: "Plan de tratamiento no encontrado" })
    }

    res.json({ message: "Plan de tratamiento eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar plan de tratamiento:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarPlanesTratamiento,
  crearPlanTratamiento,
  obtenerPlanTratamiento,
  actualizarPlanTratamiento,
  eliminarPlanTratamiento,
}
