const { ConfiguracionSistema } = require("../models")
const { validationResult } = require("express-validator")

const obtenerConfiguraciones = async (req, res) => {
  try {
    const { categoria } = req.query

    const whereClause = {}

    if (categoria) {
      whereClause.categoria = categoria
    }

    const configuraciones = await ConfiguracionSistema.findAll({
      where: whereClause,
      order: [
        ["categoria", "ASC"],
        ["clave", "ASC"],
      ],
    })

    // Convertir valores según su tipo
    const configuracionesFormateadas = configuraciones.map((config) => ({
      ...config.toJSON(),
      valor: formatearValor(config.valor, config.tipo),
    }))

    res.json(configuracionesFormateadas)
  } catch (error) {
    console.error("Error al obtener configuraciones:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerConfiguracion = async (req, res) => {
  try {
    const { clave } = req.params

    const configuracion = await ConfiguracionSistema.findOne({
      where: { clave },
    })

    if (!configuracion) {
      return res.status(404).json({ error: "Configuración no encontrada" })
    }

    const configuracionFormateada = {
      ...configuracion.toJSON(),
      valor: formatearValor(configuracion.valor, configuracion.tipo),
    }

    res.json(configuracionFormateada)
  } catch (error) {
    console.error("Error al obtener configuración:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const crearConfiguracion = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // Convertir valor a string para almacenamiento
    const valorString = typeof req.body.valor === "object" ? JSON.stringify(req.body.valor) : String(req.body.valor)

    const configuracionData = {
      ...req.body,
      valor: valorString,
    }

    const configuracion = await ConfiguracionSistema.create(configuracionData)

    const configuracionFormateada = {
      ...configuracion.toJSON(),
      valor: formatearValor(configuracion.valor, configuracion.tipo),
    }

    res.status(201).json(configuracionFormateada)
  } catch (error) {
    console.error("Error al crear configuración:", error)

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "La clave de configuración ya existe" })
    }

    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarConfiguracion = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { clave } = req.params

    // Convertir valor a string para almacenamiento
    const valorString = typeof req.body.valor === "object" ? JSON.stringify(req.body.valor) : String(req.body.valor)

    const updateData = {
      ...req.body,
      valor: valorString,
    }

    const [updatedRowsCount] = await ConfiguracionSistema.update(updateData, {
      where: { clave },
    })

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Configuración no encontrada" })
    }

    const configuracionActualizada = await ConfiguracionSistema.findOne({
      where: { clave },
    })

    const configuracionFormateada = {
      ...configuracionActualizada.toJSON(),
      valor: formatearValor(configuracionActualizada.valor, configuracionActualizada.tipo),
    }

    res.json(configuracionFormateada)
  } catch (error) {
    console.error("Error al actualizar configuración:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarConfiguracion = async (req, res) => {
  try {
    const { clave } = req.params

    const deletedRowsCount = await ConfiguracionSistema.destroy({
      where: { clave },
    })

    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: "Configuración no encontrada" })
    }

    res.json({ message: "Configuración eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar configuración:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

// Función auxiliar para formatear valores según su tipo
const formatearValor = (valor, tipo) => {
  switch (tipo) {
    case "number":
      return Number(valor)
    case "boolean":
      return valor === "true" || valor === true
    case "json":
      try {
        return JSON.parse(valor)
      } catch {
        return valor
      }
    default:
      return valor
  }
}

module.exports = {
  obtenerConfiguraciones,
  obtenerConfiguracion,
  crearConfiguracion,
  actualizarConfiguracion,
  eliminarConfiguracion,
}
