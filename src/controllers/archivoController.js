const { Archivo, Paciente, Profesional } = require("../models")
const { validationResult } = require("express-validator")
const multer = require("multer")
const path = require("path")
const fs = require("fs").promises

const listarArchivos = async (req, res) => {
  try {
    const { paciente_id, categoria } = req.query

    const whereClause = {}

    if (paciente_id) {
      whereClause.paciente_id = paciente_id
    }

    if (categoria) {
      whereClause.categoria = categoria
    }

    const archivos = await Archivo.findAll({
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
          attributes: ["id", "nombre", "apellido"],
        },
      ],
      order: [["fecha_subida", "DESC"]],
    })

    res.json(archivos)
  } catch (error) {
    console.error("Error al listar archivos:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const subirArchivo = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    if (!req.file) {
      return res.status(400).json({ error: "No se ha subido ningún archivo" })
    }

    const archivoData = {
      paciente_id: req.body.paciente_id,
      profesional_id: req.body.profesional_id || null,
      nombre_original: req.file.originalname,
      nombre_archivo: req.file.filename,
      ruta_archivo: req.file.path,
      tipo_mime: req.file.mimetype,
      tamaño: req.file.size,
      categoria: req.body.categoria || "Otro",
      descripcion: req.body.descripcion || null,
    }

    const archivo = await Archivo.create(archivoData)

    const archivoCompleto = await Archivo.findByPk(archivo.id, {
      include: [
        {
          model: Paciente,
          as: "paciente",
          attributes: ["id", "nombre", "apellido", "numero_documento"],
        },
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido"],
        },
      ],
    })

    res.status(201).json(archivoCompleto)
  } catch (error) {
    console.error("Error al subir archivo:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerArchivo = async (req, res) => {
  try {
    const { id } = req.params

    const archivo = await Archivo.findByPk(id, {
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

    if (!archivo) {
      return res.status(404).json({ error: "Archivo no encontrado" })
    }

    res.json(archivo)
  } catch (error) {
    console.error("Error al obtener archivo:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const descargarArchivo = async (req, res) => {
  try {
    const { id } = req.params

    const archivo = await Archivo.findByPk(id)

    if (!archivo) {
      return res.status(404).json({ error: "Archivo no encontrado" })
    }

    const rutaCompleta = path.resolve(archivo.ruta_archivo)

    try {
      await fs.access(rutaCompleta)
    } catch (error) {
      return res.status(404).json({ error: "Archivo físico no encontrado" })
    }

    res.setHeader("Content-Disposition", `attachment; filename="${archivo.nombre_original}"`)
    res.setHeader("Content-Type", archivo.tipo_mime)
    res.sendFile(rutaCompleta)
  } catch (error) {
    console.error("Error al descargar archivo:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarArchivo = async (req, res) => {
  try {
    const { id } = req.params

    const archivo = await Archivo.findByPk(id)

    if (!archivo) {
      return res.status(404).json({ error: "Archivo no encontrado" })
    }

    // Eliminar archivo físico
    try {
      await fs.unlink(archivo.ruta_archivo)
    } catch (error) {
      console.warn("No se pudo eliminar el archivo físico:", error.message)
    }

    // Eliminar registro de la base de datos
    await archivo.destroy()

    res.json({ message: "Archivo eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar archivo:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarArchivos,
  subirArchivo,
  obtenerArchivo,
  descargarArchivo,
  eliminarArchivo,
}
