const { Odontograma, Paciente, Profesional } = require("../models")
const { validationResult } = require("express-validator")

// Función helper para inicializar estructura de dientes
const inicializarDientesData = () => {
  const dientes = {}
  
  // Dientes superiores: 1.8 a 2.8
  for (let cuadrante = 1; cuadrante <= 2; cuadrante++) {
    for (let diente = 1; diente <= 8; diente++) {
      const key = `${cuadrante}.${diente}`
      dientes[key] = {
        estado: "sano",
        superficies: {
          oclusal: "sano",
          vestibular: "sano",
          lingual: "sano",
          mesial: "sano",
          distal: "sano"
        },
        notas: ""
      }
    }
  }
  
  // Dientes inferiores: 4.8 a 3.8
  for (let cuadrante = 3; cuadrante <= 4; cuadrante++) {
    for (let diente = 1; diente <= 8; diente++) {
      const key = `${cuadrante}.${diente}`
      dientes[key] = {
        estado: "sano",
        superficies: {
          oclusal: "sano",
          vestibular: "sano",
          lingual: "sano",
          mesial: "sano",
          distal: "sano"
        },
        notas: ""
      }
    }
  }
  
  return dientes
}

// Función helper para validar estructura de dientes
const validarDientesData = (dientesData) => {
  const estadosValidos = [
    "sano", "caries", "obturado", "extraido", 
    "ausente", "protesis", "corona", "endodoncia",
    "fractura", "movilidad"
  ]
  
  const superficiesValidas = ["oclusal", "vestibular", "lingual", "mesial", "distal"]
  
  for (const [diente, datos] of Object.entries(dientesData)) {
    // Validar formato de número de diente
    if (!/^[1-4]\.[1-8]$/.test(diente)) {
      return { valido: false, mensaje: `Formato de diente inválido: ${diente}` }
    }
    
    // Validar estado general
    if (datos.estado && !estadosValidos.includes(datos.estado)) {
      return { valido: false, mensaje: `Estado inválido para diente ${diente}` }
    }
    
    // Validar superficies
    if (datos.superficies) {
      for (const [superficie, estado] of Object.entries(datos.superficies)) {
        if (!superficiesValidas.includes(superficie)) {
          return { valido: false, mensaje: `Superficie inválida: ${superficie}` }
        }
        if (!estadosValidos.includes(estado)) {
          return { valido: false, mensaje: `Estado inválido para superficie ${superficie} del diente ${diente}` }
        }
      }
    }
  }
  
  return { valido: true }
}

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

    // Si no se envían dientes_data, inicializar con estructura vacía
    if (!req.body.dientes_data || Object.keys(req.body.dientes_data).length === 0) {
      req.body.dientes_data = inicializarDientesData()
    } else {
      // Validar estructura de dientes_data
      const validacion = validarDientesData(req.body.dientes_data)
      if (!validacion.valido) {
        return res.status(400).json({ error: validacion.mensaje })
      }
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

    // Validar dientes_data si se envían
    if (req.body.dientes_data) {
      const validacion = validarDientesData(req.body.dientes_data)
      if (!validacion.valido) {
        return res.status(400).json({ error: validacion.mensaje })
      }
    }

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

// Nueva ruta para inicializar un odontograma vacío
const inicializarOdontograma = (req, res) => {
  try {
    const dientesData = inicializarDientesData()
    res.json({ dientes_data: dientesData })
  } catch (error) {
    console.error("Error al inicializar odontograma:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

// Nueva ruta para obtener estadísticas del odontograma
const obtenerEstadisticas = async (req, res) => {
  try {
    const { id } = req.params

    const odontograma = await Odontograma.findByPk(id)

    if (!odontograma) {
      return res.status(404).json({ error: "Odontograma no encontrado" })
    }

    const estadisticas = {
      total_dientes: 32,
      sanos: 0,
      con_caries: 0,
      obturados: 0,
      extraidos: 0,
      ausentes: 0,
      otros: 0
    }

    Object.values(odontograma.dientes_data).forEach(diente => {
      switch (diente.estado) {
        case "sano":
          estadisticas.sanos++
          break
        case "caries":
          estadisticas.con_caries++
          break
        case "obturado":
          estadisticas.obturados++
          break
        case "extraido":
          estadisticas.extraidos++
          break
        case "ausente":
          estadisticas.ausentes++
          break
        default:
          estadisticas.otros++
      }
    })

    res.json(estadisticas)
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarOdontogramas,
  crearOdontograma,
  obtenerOdontograma,
  actualizarOdontograma,
  eliminarOdontograma,
  inicializarOdontograma,
  obtenerEstadisticas,
}