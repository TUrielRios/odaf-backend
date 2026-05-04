const { Ausencia, Profesional } = require("../models")

const listarAusencias = async (req, res) => {
  try {
    const ausencias = await Ausencia.findAll({
      include: [
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido"]
        }
      ],
      order: [["fecha_inicio", "DESC"]]
    })
    res.json(ausencias)
  } catch (error) {
    console.error("Error al listar ausencias:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const crearAusencia = async (req, res) => {
  try {
    const { profesional_id, fecha_inicio, fecha_fin, hora_inicio, hora_fin, motivo } = req.body

    if (!profesional_id || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: "Faltan datos obligatorios (profesional_id, fecha_inicio, fecha_fin)" })
    }

    const ausencia = await Ausencia.create({
      profesional_id,
      fecha_inicio,
      fecha_fin,
      hora_inicio,
      hora_fin,
      motivo
    })

    res.status(201).json(ausencia)
  } catch (error) {
    console.error("Error al crear ausencia:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarAusencia = async (req, res) => {
  try {
    const { id } = req.params
    const ausencia = await Ausencia.findByPk(id)

    if (!ausencia) {
      return res.status(404).json({ error: "Ausencia no encontrada" })
    }

    await ausencia.destroy()
    res.json({ message: "Ausencia eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar ausencia:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarAusencias,
  crearAusencia,
  eliminarAusencia
}
