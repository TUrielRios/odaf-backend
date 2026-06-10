const {
  Paciente,
  ObraSocial,
  Odontograma,
  HistorialClinico,
  Prescripcion,
  PlanTratamiento,
  Archivo,
  Turno,
  Prestacion,
  UsuarioPaciente,
  Presupuesto,
  Sequelize,
} = require("../models")
const { validationResult } = require("express-validator")
const { Op } = require("sequelize")
const { uploadToFirebase } = require("../utils/firebaseUpload")

const listarPacientes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", condicion = "", mes_nacimiento } = req.query
    const offset = (page - 1) * limit

    const whereClause = {}

    if (mes_nacimiento) {
      whereClause[Op.and] = whereClause[Op.and] || []
      whereClause[Op.and].push(
        Sequelize.where(
          Sequelize.fn("date_part", "month", Sequelize.col("fecha_nacimiento")),
          Number(mes_nacimiento)
        )
      )
    }

    if (search) {
      const searchWords = search.split(" ").filter((w) => w.length > 0)
      whereClause[Op.and] = searchWords.map((word) => ({
        [Op.or]: [
          { nombre: { [Op.iLike]: `%${word}%` } },
          { apellido: { [Op.iLike]: `%${word}%` } },
          { numero_documento: { [Op.iLike]: `%${word}%` } },
        ],
      }))
    }

    if (condicion) {
      whereClause.condicion = condicion
    }

    const count = await Paciente.count({ where: whereClause })
    const rows = await Paciente.findAll({
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

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ error: error.errors[0].message })
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

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ error: error.errors[0].message })
    }

    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarPaciente = async (req, res) => {
  try {
    const { id } = req.params

    await Turno.destroy({ where: { paciente_id: id } })
    await Prestacion.destroy({ where: { paciente_id: id } })
    await HistorialClinico.destroy({ where: { paciente_id: id } })
    await PlanTratamiento.destroy({ where: { paciente_id: id } })
    await Odontograma.destroy({ where: { paciente_id: id } })
    await Archivo.destroy({ where: { paciente_id: id } })
    await Prescripcion.destroy({ where: { paciente_id: id } })
    await UsuarioPaciente.destroy({ where: { paciente_id: id } })
    await Presupuesto.destroy({ where: { paciente_id: id } })

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

const subirFotoPaciente = async (req, res) => {
  try {
    const { id } = req.params

    const paciente = await Paciente.findByPk(id)
    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" })
    }

    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó una imagen" })
    }

    const foto_url = await uploadToFirebase(req.file, `odaf/pacientes/${id}`)

    await Paciente.update({ foto_url }, { where: { id } })

    const pacienteActualizado = await Paciente.findByPk(id, {
      include: [{ model: ObraSocial, as: "obraSocial" }],
    })

    res.json(pacienteActualizado)
  } catch (error) {
    console.error("Error al subir foto del paciente:", error)
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
  subirFotoPaciente,
}
