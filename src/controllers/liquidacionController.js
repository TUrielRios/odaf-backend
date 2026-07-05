const { Liquidacion, Prestacion, Profesional, Paciente, Servicio, ObraSocial } = require("../models")
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

    const count = await Liquidacion.count({ where })
    const liquidaciones = await Liquidacion.findAll({
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
          attributes: ["id", "nombre", "apellido", "numero_matricula", "email", "porcentaje_comision"],
        },
        {
          model: Prestacion,
          as: "prestaciones",
          include: [
            {
              model: Paciente,
              as: "paciente",
              attributes: ["id", "nombre", "apellido"],
              include: [
                {
                  model: ObraSocial,
                  as: "obraSocial",
                  attributes: ["id", "nombre"],
                  required: false,
                },
              ],
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

    const { profesional_id, periodo_inicio, periodo_fin, observaciones, monto_custom, tipo, obra_social_id } = req.body

    // Verificar que el profesional existe
    const profesional = await Profesional.findByPk(profesional_id)
    if (!profesional) {
      return res.status(404).json({ message: "Profesional no encontrado" })
    }

    // Buscar prestaciones pendientes del profesional en el período,
    // con los mismos filtros que usa la simulación para que lo confirmado
    // coincida exactamente con lo previsualizado
    const wherePrestaciones = {
      profesional_id,
      fecha: {
        [Op.between]: [periodo_inicio, periodo_fin],
      },
      estado: "Pendiente",
      liquidacion_id: null,
    }

    const includePrestaciones = [
      {
        model: Servicio,
        as: "servicio",
        attributes: ["nombre"],
      },
    ]

    if (tipo === "obra_social") {
      wherePrestaciones["$paciente.obra_social_id$"] = obra_social_id || { [Op.ne]: null }
      includePrestaciones.push({
        model: Paciente,
        as: "paciente",
        attributes: ["id", "obra_social_id"],
      })
    }

    const prestaciones = await Prestacion.findAll({
      where: wherePrestaciones,
      include: includePrestaciones,
      subQuery: false,
    })

    if (prestaciones.length === 0) {
      return res.status(400).json({
        message: "No hay prestaciones pendientes para liquidar en el período especificado",
      })
    }

    // Calcular totales: sumar todo primero, luego aplicar la comisión del profesional UNA VEZ
    const monto_total_servicios = prestaciones.reduce((sum, p) => sum + parseFloat(p.monto_total), 0)
    const porcentaje_comision = parseFloat(profesional.porcentaje_comision) || 50
    let monto_profesional = parseFloat(((monto_total_servicios * porcentaje_comision) / 100).toFixed(2))

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

// Actualizar monto u observaciones de una liquidación (solo si no está Pagada)
exports.actualizarLiquidacion = async (req, res) => {
  try {
    const { id } = req.params
    const { monto_profesional, observaciones } = req.body

    const liquidacion = await Liquidacion.findByPk(id)
    if (!liquidacion) return res.status(404).json({ message: "Liquidación no encontrada" })
    if (liquidacion.estado === "Pagada") {
      return res.status(400).json({ message: "No se puede editar una liquidación ya pagada" })
    }

    const updates = {}
    if (monto_profesional !== undefined) updates.monto_profesional = parseFloat(monto_profesional).toFixed(2)
    if (observaciones !== undefined) updates.observaciones = observaciones

    await liquidacion.update(updates)
    res.json(liquidacion)
  } catch (error) {
    console.error("Error al actualizar liquidación:", error)
    res.status(500).json({ message: "Error al actualizar liquidación", error: error.message })
  }
}

// Eliminar permanentemente una liquidación (solo si no está Pagada)
exports.eliminarLiquidacion = async (req, res) => {
  try {
    const { id } = req.params

    const liquidacion = await Liquidacion.findByPk(id)

    if (!liquidacion) {
      return res.status(404).json({ message: "Liquidación no encontrada" })
    }

    if (liquidacion.estado === "Pagada") {
      return res.status(400).json({ message: "No se puede eliminar una liquidación ya pagada" })
    }

    // Revertir prestaciones asociadas antes de borrar
    await Prestacion.update(
      { liquidacion_id: null, estado: "Pendiente", fecha_liquidacion: null },
      { where: { liquidacion_id: id } }
    )

    await liquidacion.destroy()

    res.json({ message: "Liquidación eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar liquidación:", error)
    res.status(500).json({ message: "Error al eliminar liquidación", error: error.message })
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
// Zona horaria de la clínica: los períodos se calculan siempre en hora argentina,
// sin importar la zona horaria del servidor.
const TIMEZONE_CLINICA = "America/Argentina/Buenos_Aires"

// Fecha "YYYY-MM-DD" a partir de componentes numéricos
const formatYMD = (anio, mes, dia) => `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`

// Simular una liquidación (Pre-visualización)
exports.simularLiquidacion = async (req, res) => {
  try {
    const { profesional_id, periodo, tipo, obra_social_id, fecha_custom_inicio, fecha_custom_fin } = req.body

    // Determinar el rango de fechas (strings "YYYY-MM-DD", comparables con la columna DATEONLY).
    // "Hoy" en hora argentina; en-CA formatea como YYYY-MM-DD.
    const hoyStr = new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE_CLINICA })
    const [anio, mes, dia] = hoyStr.split("-").map(Number)
    // Date local solo para aritmética de días (mediodía para evitar bordes de día)
    const hoy = new Date(anio, mes - 1, dia, 12)

    let fechaInicio = hoyStr
    let fechaFin = hoyStr

    if (periodo === "semana") {
      const day = hoy.getDay()
      const lunes = new Date(hoy)
      lunes.setDate(hoy.getDate() - day + (day === 0 ? -6 : 1)) // Ajustar al lunes
      fechaInicio = formatYMD(lunes.getFullYear(), lunes.getMonth() + 1, lunes.getDate())
    } else if (periodo === "mes") {
      fechaInicio = formatYMD(anio, mes, 1)
    } else if (periodo === "custom") {
      if (!fecha_custom_inicio || !fecha_custom_fin) {
        return res.status(400).json({ message: "Debe especificar fecha de inicio y fin para rango personalizado" })
      }
      fechaInicio = String(fecha_custom_inicio).slice(0, 10)
      fechaFin = String(fecha_custom_fin).slice(0, 10)
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
      subQuery: false,
    })

    // Traer el profesional para obtener su comisión actual
    const profesional = await Profesional.findByPk(profesional_id, {
      attributes: ["id", "porcentaje_comision"],
    })
    const porcentaje_comision = parseFloat(profesional?.porcentaje_comision) || 50

    // Calcular totales: sumar el valor completo de todos los tratamientos primero,
    // luego aplicar la comisión del profesional UNA SOLA VEZ sobre el total
    const monto_total_servicios = prestaciones.reduce((sum, p) => sum + parseFloat(p.monto_total), 0)
    const monto_profesional = parseFloat(((monto_total_servicios * porcentaje_comision) / 100).toFixed(2))

    res.json({
      periodo_inicio: fechaInicio,
      periodo_fin: fechaFin,
      cantidad_prestaciones: prestaciones.length,
      monto_total_servicios: monto_total_servicios.toFixed(2),
      monto_profesional: monto_profesional.toFixed(2),
      porcentaje_profesional: porcentaje_comision,
      prestaciones,
    })
  } catch (error) {
    console.error("Error al simular liquidación:", error)
    res.status(500).json({ message: "Error al simular liquidación", error: error.message })
  }
}
