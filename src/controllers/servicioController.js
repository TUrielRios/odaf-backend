const { Servicio, SubServicio, Profesional, ProfesionalServicio } = require("../models")
const { validationResult } = require("express-validator")
const { Op } = require("sequelize")

const listarServicios = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", categoria = "", estado = "" } = req.query
    const offset = (page - 1) * limit

    const whereClause = {}

    if (search) {
      whereClause[Op.or] = [{ nombre: { [Op.iLike]: `%${search}%` } }, { descripcion: { [Op.iLike]: `%${search}%` } }]
    }

    if (categoria) {
      whereClause.categoria = categoria
    }

    if (estado) {
      whereClause.estado = estado
    }

    const { count, rows } = await Servicio.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: SubServicio,
          as: "subServicios",
          where: { estado: "Activo" },
          required: false,
        },
      ],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [["nombre", "ASC"]],
    })

    res.json({
      servicios: rows,
      pagination: {
        total: count,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    console.error("Error al listar servicios:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const crearServicio = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const servicio = await Servicio.create(req.body)
    res.status(201).json(servicio)
  } catch (error) {
    console.error("Error al crear servicio:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerServicio = async (req, res) => {
  try {
    const { id } = req.params

    const servicio = await Servicio.findByPk(id, {
      include: [
        {
          model: SubServicio,
          as: "subServicios",
        },
      ],
    })

    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" })
    }

    res.json(servicio)
  } catch (error) {
    console.error("Error al obtener servicio:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarServicio = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params

    const [updatedRowsCount] = await Servicio.update(req.body, {
      where: { id },
    })

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Servicio no encontrado" })
    }

    const servicioActualizado = await Servicio.findByPk(id)
    res.json(servicioActualizado)
  } catch (error) {
    console.error("Error al actualizar servicio:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarServicio = async (req, res) => {
  try {
    const { id } = req.params

    const deletedRowsCount = await Servicio.destroy({
      where: { id },
    })

    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: "Servicio no encontrado" })
    }

    res.json({ message: "Servicio eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar servicio:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

// SubServicios
const crearSubServicio = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const subServicio = await SubServicio.create(req.body)
    res.status(201).json(subServicio)
  } catch (error) {
    console.error("Error al crear subservicio:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarSubServicio = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params

    const [updatedRowsCount] = await SubServicio.update(req.body, {
      where: { id },
    })

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "SubServicio no encontrado" })
    }

    const subServicioActualizado = await SubServicio.findByPk(id)
    res.json(subServicioActualizado)
  } catch (error) {
    console.error("Error al actualizar subservicio:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarSubServicio = async (req, res) => {
  try {
    const { id } = req.params

    const deletedRowsCount = await SubServicio.destroy({
      where: { id },
    })

    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: "SubServicio no encontrado" })
    }

    res.json({ message: "SubServicio eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar subservicio:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerSubservicios = async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 10, estado = "" } = req.query
    const offset = (page - 1) * limit

    // Verificar que el servicio existe
    const servicio = await Servicio.findByPk(id)
    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" })
    }

    const whereClause = { servicio_id: id }
    if (estado) {
      whereClause.estado = estado
    }

    const { count, rows } = await SubServicio.findAndCountAll({
      where: whereClause,
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [["nombre", "ASC"]],
    })

    res.json({
      subservicios: rows,
      pagination: {
        total: count,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    console.error("Error al obtener subservicios:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerProfesionalesServicio = async (req, res) => {
  try {
    const { id } = req.params

    const servicio = await Servicio.findByPk(id, {
      include: [
        {
          model: Profesional,
          as: "profesionales",
          through: {
            attributes: ["estado", "createdAt"],
            where: { estado: "Activo" },
          },
          attributes: ["id", "nombre", "apellido", "especialidad", "telefono", "email"],
        },
      ],
    })

    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" })
    }

    res.json({
      servicio_id: Number.parseInt(id),
      nombre: servicio.nombre,
      profesionales: servicio.profesionales,
    })
  } catch (error) {
    console.error("Error al obtener profesionales del servicio:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarServicios,
  crearServicio,
  obtenerServicio,
  actualizarServicio,
  eliminarServicio,
  obtenerSubservicios,
  crearSubServicio,
  actualizarSubServicio,
  eliminarSubServicio,
  obtenerProfesionalesServicio,
}
