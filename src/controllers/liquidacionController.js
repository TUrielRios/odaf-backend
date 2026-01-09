const { Liquidacion, Prestacion, Profesional, Paciente, Servicio } = require("../models")
const { validationResult } = require("express-validator")
const { Op } = require("sequelize")

// Obtener todas las liquidaciones con filtros opcionales
exports.obtenerLiquidaciones = async (req, res) => {
  try {
    const { profesional_id, estado, fecha_inicio, fecha_fin, page = 1, limit = 50 } = req.query

    const where = {}

    if (profesional_id) {
      where.profesional_id = profesional_id
    }

    if (estado) {
      where.estado = estado
    }

    if (fecha_inicio && fecha_fin) {
      where.periodo_inicio = {
        [Op.gte]: fecha_inicio,
      }
      where.periodo_fin = {
        [Op.lte]: fecha_fin,
      }
    }

    const offset = (page - 1) * limit

    const { count, rows: liquidaciones } = await Liquidacion.findAndCountAll({
      where,
      include: [
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido", "numero_matricula"],
        },
      ],
      order: [["periodo_inicio", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    })

    res.json({
      liquidaciones,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    })
  } catch (error) {
    console.error("Error al obtener liquidaciones:", error)
    res.status(500).json({ message: "Error al obtener liquidaciones", error: error.message })
  }
}

// Obtener una liquidación por ID con sus prestaciones
exports.obtenerLiquidacionPorId = async (req, res) => {
  try {
    const { id } = req.params

    const liquidacion = await Liquidacion.findByPk(id, {
      include: [
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido", "numero_matricula", "email"],
        },
        {
          model: Prestacion,
          as: "prestaciones",
          include: [
            {
              model: Paciente,
              as: "paciente",
              attributes: ["id", "nombre", "apellido"],
            },
            {
              model: Servicio,
              as: "servicio",
              attributes: ["id", "nombre", "precio_base"],
            },
          ],
        },
      ],
    })

    if (!liquidacion) {
      return res.status(404).json({ message: "Liquidación no encontrada" })
    }

    res.json(liquidacion)
  } catch (error) {
    console.error("Error al obtener liquidación:", error)
    res.status(500).json({ message: "Error al obtener liquidación", error: error.message })
  }
}

// Generar una nueva liquidación para un profesional en un período
exports.generarLiquidacion = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { profesional_id, periodo_inicio, periodo_fin, observaciones, monto_custom } = req.body

    // Verificar que el profesional existe
    const profesional = await Profesional.findByPk(profesional_id)
    if (!profesional) {
      return res.status(404).json({ message: "Profesional no encontrado" })
    }

    // Buscar prestaciones pendientes del profesional en el período
    const prestaciones = await Prestacion.findAll({
      where: {
        profesional_id,
        fecha: {
          [Op.between]: [periodo_inicio, periodo_fin],
        },
        estado: "Pendiente",
        liquidacion_id: null,
      },
      include: [
        {
          model: Servicio,
          as: "servicio",
          attributes: ["nombre"],
        },
      ],
    })

    if (prestaciones.length === 0) {
      return res.status(400).json({
        message: "No hay prestaciones pendientes para liquidar en el período especificado",
      })
    }

    // Calcular totales
    const monto_total_servicios = prestaciones.reduce((sum, p) => sum + parseFloat(p.monto_total), 0)
    let monto_profesional = prestaciones.reduce((sum, p) => sum + parseFloat(p.monto_profesional), 0)

    // Si se proporciona un monto personalizado, usarlo
    if (monto_custom !== undefined && monto_custom !== null) {
      monto_profesional = parseFloat(monto_custom)
    }

    // Crear la liquidación
    const liquidacion = await Liquidacion.create({
      profesional_id,
      periodo_inicio,
      periodo_fin,
      monto_total_servicios: monto_total_servicios.toFixed(2),
      monto_profesional: monto_profesional.toFixed(2),
      cantidad_prestaciones: prestaciones.length,
      estado: "Generada",
      observaciones,
      detalles: {
        prestaciones_ids: prestaciones.map((p) => p.id),
      },
    })

    // Actualizar prestaciones para asociarlas con la liquidación
    await Prestacion.update(
      {
        liquidacion_id: liquidacion.id,
        estado: "Liquidado",
        fecha_liquidacion: new Date(),
      },
      {
        where: {
          id: {
            [Op.in]: prestaciones.map((p) => p.id),
          },
        },
      },
    )

    // Cargar la liquidación completa con sus relaciones
    const liquidacionCompleta = await Liquidacion.findByPk(liquidacion.id, {
      include: [
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido", "numero_matricula"],
        },
        {
          model: Prestacion,
          as: "prestaciones",
        },
      ],
    })

    res.status(201).json(liquidacionCompleta)
  } catch (error) {
    console.error("Error al generar liquidación:", error)
    res.status(500).json({ message: "Error al generar liquidación", error: error.message })
  }
}

// Registrar el pago de una liquidación
exports.registrarPago = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const { fecha_pago, metodo_pago, observaciones } = req.body

    const liquidacion = await Liquidacion.findByPk(id)

    if (!liquidacion) {
      return res.status(404).json({ message: "Liquidación no encontrada" })
    }

    if (liquidacion.estado === "Pagada") {
      return res.status(400).json({ message: "Esta liquidación ya ha sido pagada" })
    }

    if (liquidacion.estado === "Anulada") {
      return res.status(400).json({ message: "No se puede pagar una liquidación anulada" })
    }

    // Actualizar liquidación
    await liquidacion.update({
      estado: "Pagada",
      fecha_pago,
      metodo_pago,
      observaciones: observaciones || liquidacion.observaciones,
    })

    // Actualizar prestaciones asociadas
    await Prestacion.update(
      {
        estado: "Pagado",
        fecha_pago,
      },
      {
        where: {
          liquidacion_id: id,
        },
      },
    )

    const liquidacionActualizada = await Liquidacion.findByPk(id, {
      include: [
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido", "numero_matricula", "email"],
        },
      ],
    })

    res.json(liquidacionActualizada)
  } catch (error) {
    console.error("Error al registrar pago:", error)
    res.status(500).json({ message: "Error al registrar pago", error: error.message })
  }
}

// Anular una liquidación
exports.anularLiquidacion = async (req, res) => {
  try {
    const { id } = req.params
    const { motivo } = req.body

    const liquidacion = await Liquidacion.findByPk(id)

    if (!liquidacion) {
      return res.status(404).json({ message: "Liquidación no encontrada" })
    }

    if (liquidacion.estado === "Pagada") {
      return res.status(400).json({ message: "No se puede anular una liquidación ya pagada" })
    }

    // Actualizar liquidación
    await liquidacion.update({
      estado: "Anulada",
      observaciones: `${liquidacion.observaciones || ""}\nAnulada: ${motivo}`,
    })

    // Revertir estado de las prestaciones
    await Prestacion.update(
      {
        liquidacion_id: null,
        estado: "Pendiente",
        fecha_liquidacion: null,
      },
      {
        where: {
          liquidacion_id: id,
        },
      },
    )

    res.json({ message: "Liquidación anulada correctamente", liquidacion })
  } catch (error) {
    console.error("Error al anular liquidación:", error)
    res.status(500).json({ message: "Error al anular liquidación", error: error.message })
  }
}

// Obtener resumen de liquidaciones por profesional
exports.obtenerResumenPorProfesional = async (req, res) => {
  try {
    const { profesional_id } = req.params
    const { fecha_inicio, fecha_fin } = req.query

    const where = { profesional_id }

    if (fecha_inicio && fecha_fin) {
      where.periodo_inicio = {
        [Op.gte]: fecha_inicio,
      }
      where.periodo_fin = {
        [Op.lte]: fecha_fin,
      }
    }

    const liquidaciones = await Liquidacion.findAll({
      where,
      attributes: [
        "estado",
        [Liquidacion.sequelize.fn("COUNT", Liquidacion.sequelize.col("id")), "cantidad"],
        [Liquidacion.sequelize.fn("SUM", Liquidacion.sequelize.col("monto_profesional")), "total"],
      ],
      group: ["estado"],
    })

    const prestacionesPendientes = await Prestacion.count({
      where: {
        profesional_id,
        estado: "Pendiente",
        liquidacion_id: null,
        ...(fecha_inicio &&
          fecha_fin && {
          fecha: {
            [Op.between]: [fecha_inicio, fecha_fin],
          },
        }),
      },
    })

    res.json({
      resumen_liquidaciones: liquidaciones,
      prestaciones_pendientes: prestacionesPendientes,
    })
  } catch (error) {
    console.error("Error al obtener resumen:", error)
    res.status(500).json({ message: "Error al obtener resumen", error: error.message })
  }
}
// Simular una liquidación (Pre-visualización)
exports.simularLiquidacion = async (req, res) => {
  try {
    const { profesional_id, periodo, tipo, obra_social_id, fecha_custom_inicio, fecha_custom_fin } = req.body

    // Determinar fechas según el período seleccionado
    let fechaInicio = new Date()
    let fechaFin = new Date()

    if (periodo === "hoy") {
      fechaInicio.setHours(0, 0, 0, 0)
      fechaFin.setHours(23, 59, 59, 999)
    } else if (periodo === "semana") {
      const day = fechaInicio.getDay()
      const diff = fechaInicio.getDate() - day + (day === 0 ? -6 : 1) // Ajustar al lunes
      fechaInicio.setDate(diff)
      fechaInicio.setHours(0, 0, 0, 0)
      fechaFin.setHours(23, 59, 59, 999)
    } else if (periodo === "mes") {
      fechaInicio.setDate(1)
      fechaInicio.setHours(0, 0, 0, 0)
      fechaFin.setHours(23, 59, 59, 999)
    } else if (periodo === "custom") {
      if (!fecha_custom_inicio || !fecha_custom_fin) {
        return res.status(400).json({ message: "Debe especificar fecha de inicio y fin para rango personalizado" })
      }
      fechaInicio = new Date(fecha_custom_inicio)
      fechaFin = new Date(fecha_custom_fin)
      // Ajustar fin del día para la fecha fin
      fechaFin.setHours(23, 59, 59, 999)
    }

    const where = {
      profesional_id,
      fecha: {
        [Op.between]: [fechaInicio, fechaFin],
      },
      estado: "Pendiente", // Solo prestaciones no liquidadas
      liquidacion_id: null,
    }

    // Filtros adicionales según el tipo
    const include = [
      {
        model: Servicio,
        as: "servicio",
        attributes: ["nombre", "precio_base"],
      },
      {
        model: Paciente,
        as: "paciente",
        attributes: ["id", "nombre", "apellido", "obra_social_id"],
        include: [
          {
            model: require("../models").ObraSocial, // Importación dinámica para evitar ciclos si los hubiera
            as: "obraSocial",
            attributes: ["id", "nombre"],
          },
        ],
      },
    ]

    // Lógica para filtrar por Obra Social vs Particulares
    if (tipo === "obra_social") {
      if (obra_social_id) {
        // Filtrar por una obra social específica
        where["$paciente.obra_social_id$"] = obra_social_id
      } else {
        // Filtrar solo pacientes con obra social (cualquiera)
        where["$paciente.obra_social_id$"] = { [Op.ne]: null }
      }
    } else if (tipo === "pago_recibido") {
      // Asumimos que "Pago recibido" se refiere a particulares o pagos directos
      // Podríamos filtrar donde obra_social_id sea null, o simplemente todo lo que no sea OS
      // Por ahora, si no es OS, traemos todo lo que coincida con las fechas
    }

    const prestaciones = await Prestacion.findAll({
      where,
      include,
    })

    // Calcular totales
    const monto_total_servicios = prestaciones.reduce((sum, p) => sum + parseFloat(p.monto_total), 0)
    const monto_profesional = prestaciones.reduce((sum, p) => sum + parseFloat(p.monto_profesional), 0)

    res.json({
      periodo_inicio: fechaInicio,
      periodo_fin: fechaFin,
      cantidad_prestaciones: prestaciones.length,
      monto_total_servicios: monto_total_servicios.toFixed(2),
      monto_profesional: monto_profesional.toFixed(2),
      prestaciones,
    })
  } catch (error) {
    console.error("Error al simular liquidación:", error)
    res.status(500).json({ message: "Error al simular liquidación", error: error.message })
  }
}
