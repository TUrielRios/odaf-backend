const { Feriado } = require("../models")
const { validationResult } = require("express-validator")
const { Op } = require("sequelize")

const listarFeriados = async (req, res) => {
  try {
    const { year } = req.query
    const whereClause = {}

    if (year) {
      whereClause.fecha = {
        [Op.between]: [`${year}-01-01`, `${year}-12-31`],
      }
    }

    const feriados = await Feriado.findAll({
      where: whereClause,
      order: [["fecha", "ASC"]],
    })

    res.json(feriados)
  } catch (error) {
    console.error("Error al listar feriados:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const crearFeriado = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const feriado = await Feriado.create(req.body)
    res.status(201).json(feriado)
  } catch (error) {
    console.error("Error al crear feriado:", error)
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Ya existe un feriado para esa fecha" })
    }
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarFeriado = async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await Feriado.destroy({ where: { id } })

    if (deleted === 0) {
      return res.status(404).json({ error: "Feriado no encontrado" })
    }

    res.json({ message: "Feriado eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar feriado:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarFeriados,
  crearFeriado,
  eliminarFeriado,
}
