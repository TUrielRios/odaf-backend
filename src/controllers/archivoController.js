const { Archivo, Paciente, Profesional } = require("../models")
const { validationResult } = require("express-validator")
const path = require("path")
const { uploadToFirebase, deleteFromFirebase } = require("../utils/firebaseUpload")
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

    const archivosFormateados = archivos.map((archivo) => ({
      ...archivo.toJSON(),
      nombre: archivo.nombre_original,
      tipo: archivo.tipo_mime,
      ruta: archivo.ruta_archivo, // Return the Cloudinary URL directly
    }))

    res.json(archivosFormateados)
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

    const pacienteId = req.body.paciente_id || "unknown"
    const firebaseUrl = await uploadToFirebase(req.file, `odaf/archivos_pacientes/${pacienteId}`)

    const archivoData = {
      paciente_id: req.body.paciente_id,
      profesional_id: req.body.profesional_id || null,
      nombre_original: req.file.originalname,
      nombre_archivo: req.file.originalname,
      ruta_archivo: firebaseUrl,
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

    const archivoFormateado = {
      ...archivoCompleto.toJSON(),
      nombre: archivoCompleto.nombre_original,
      tipo: archivoCompleto.tipo_mime,
      ruta: archivoCompleto.ruta_archivo,
    }

    res.status(201).json(archivoFormateado)
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

    const archivoFormateado = {
      ...archivo.toJSON(),
      nombre: archivo.nombre_original,
      tipo: archivo.tipo_mime,
      ruta: archivo.ruta_archivo,
    }

    res.json(archivoFormateado)
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

    // Si es una URL de Cloudinary, redirigir
    if (archivo.ruta_archivo.startsWith('http')) {
      return res.redirect(archivo.ruta_archivo)
    }

    const rutaCompleta = path.resolve(archivo.ruta_archivo)
    await fs.access(rutaCompleta)
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

    // Eliminar archivo de Firebase Storage o local
    if (archivo.ruta_archivo.startsWith('http')) {
      await deleteFromFirebase(archivo.ruta_archivo)
    } else {
      try {
        await fs.unlink(archivo.ruta_archivo)
      } catch (error) {
        console.warn("No se pudo eliminar el archivo físico:", error.message)
      }
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
