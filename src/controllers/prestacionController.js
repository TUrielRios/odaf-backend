const { Prestacion, Profesional, Paciente, Servicio, SubServicio, Turno } = require("../models")
const { validationResult } = require("express-validator")
const { Op } = require("sequelize")
const sequelize = require("sequelize")

const listarPrestaciones = async (req, res) => {
  try {
    const { page = 1, limit = 10, profesional_id, paciente_id, estado, fecha_desde, fecha_hasta } = req.query

    const offset = (page - 1) * limit
    const whereClause = {}

    if (profesional_id) {
      whereClause.profesional_id = profesional_id
    }

    if (paciente_id) {
      whereClause.paciente_id = paciente_id
    }

    if (estado) {
      whereClause.estado = estado
    }

    if (fecha_desde && fecha_hasta) {
      whereClause.fecha = {
        [Op.between]: [fecha_desde, fecha_hasta],
      }
    } else if (fecha_desde) {
      whereClause.fecha = {
        [Op.gte]: fecha_desde,
      }
    } else if (fecha_hasta) {
      whereClause.fecha = {
        [Op.lte]: fecha_hasta,
      }
    }

    const { count, rows } = await Prestacion.findAndCountAll({
      where: whereClause,
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [["fecha", "DESC"]],
      include: [
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido", "especialidad"],
        },
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
        {
          model: SubServicio,
          as: "subservicio",
          attributes: ["id", "nombre", "precio"],
        },
      ],
    })

    res.json({
      prestaciones: rows,
      pagination: {
        total: count,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    console.error("Error al listar prestaciones:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const crearPrestacion = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const prestacion = await Prestacion.create(req.body)

    const prestacionCompleta = await Prestacion.findByPk(prestacion.id, {
      include: [
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido", "especialidad"],
        },
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
        {
          model: SubServicio,
          as: "subservicio",
          attributes: ["id", "nombre", "precio"],
        },
      ],
    })

    res.status(201).json(prestacionCompleta)
  } catch (error) {
    console.error("Error al crear prestación:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerPrestacion = async (req, res) => {
  try {
    const { id } = req.params

    const prestacion = await Prestacion.findByPk(id, {
      include: [
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido", "especialidad"],
        },
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
        {
          model: SubServicio,
          as: "subservicio",
          attributes: ["id", "nombre", "precio"],
        },
      ],
    })

    if (!prestacion) {
      return res.status(404).json({ error: "Prestación no encontrada" })
    }

    res.json(prestacion)
  } catch (error) {
    console.error("Error al obtener prestación:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarPrestacion = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params

    const [updatedRowsCount] = await Prestacion.update(req.body, {
      where: { id },
    })

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Prestación no encontrada" })
    }

    const prestacionActualizada = await Prestacion.findByPk(id, {
      include: [
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido", "especialidad"],
        },
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
        {
          model: SubServicio,
          as: "subservicio",
          attributes: ["id", "nombre", "precio"],
        },
      ],
    })

    res.json(prestacionActualizada)
  } catch (error) {
    console.error("Error al actualizar prestación:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarPrestacion = async (req, res) => {
  try {
    const { id } = req.params

    const deletedRowsCount = await Prestacion.destroy({
      where: { id },
    })

    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: "Prestación no encontrada" })
    }

    res.json({ message: "Prestación eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar prestación:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const calcularLiquidacion = async (req, res) => {
  try {
    const { profesional_id } = req.params
    const { fecha_desde, fecha_hasta, estado = "Pendiente" } = req.query

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({
        error: "Se requieren fecha_desde y fecha_hasta para calcular la liquidación",
      })
    }

    // Verificar que el profesional existe
    const profesional = await Profesional.findByPk(profesional_id)
    if (!profesional) {
      return res.status(404).json({ error: "Profesional no encontrado" })
    }

    const whereClause = {
      profesional_id,
      fecha: {
        [Op.between]: [fecha_desde, fecha_hasta],
      },
    }

    // Si se especifica estado, filtrar por él
    if (estado && estado !== "Todos") {
      whereClause.estado = estado
    }

    const prestaciones = await Prestacion.findAll({
      where: whereClause,
      include: [
        {
          model: Paciente,
          as: "paciente",
          attributes: ["id", "nombre", "apellido"],
        },
        {
          model: Servicio,
          as: "servicio",
          attributes: ["id", "nombre"],
        },
        {
          model: SubServicio,
          as: "subservicio",
          attributes: ["id", "nombre"],
        },
      ],
      order: [["fecha", "ASC"]],
    })

    // Calcular totales
    const totales = prestaciones.reduce(
      (acc, prestacion) => {
        acc.cantidad_prestaciones += 1
        acc.monto_total += Number.parseFloat(prestacion.monto_total)
        acc.monto_profesional += Number.parseFloat(prestacion.monto_profesional)
        acc.monto_clinica += Number.parseFloat(prestacion.monto_total) - Number.parseFloat(prestacion.monto_profesional)

        // Agrupar por estado
        if (!acc.por_estado[prestacion.estado]) {
          acc.por_estado[prestacion.estado] = {
            cantidad: 0,
            monto_total: 0,
            monto_profesional: 0,
          }
        }
        acc.por_estado[prestacion.estado].cantidad += 1
        acc.por_estado[prestacion.estado].monto_total += Number.parseFloat(prestacion.monto_total)
        acc.por_estado[prestacion.estado].monto_profesional += Number.parseFloat(prestacion.monto_profesional)

        return acc
      },
      {
        cantidad_prestaciones: 0,
        monto_total: 0,
        monto_profesional: 0,
        monto_clinica: 0,
        por_estado: {},
      },
    )

    res.json({
      profesional: {
        id: profesional.id,
        nombre: profesional.nombre,
        apellido: profesional.apellido,
        especialidad: profesional.especialidad,
      },
      periodo: {
        fecha_desde,
        fecha_hasta,
      },
      totales: {
        cantidad_prestaciones: totales.cantidad_prestaciones,
        monto_total: Number.parseFloat(totales.monto_total.toFixed(2)),
        monto_profesional: Number.parseFloat(totales.monto_profesional.toFixed(2)),
        monto_clinica: Number.parseFloat(totales.monto_clinica.toFixed(2)),
        porcentaje_promedio:
          totales.cantidad_prestaciones > 0
            ? Number.parseFloat(((totales.monto_profesional / totales.monto_total) * 100).toFixed(2))
            : 0,
      },
      por_estado: totales.por_estado,
      prestaciones,
    })
  } catch (error) {
    console.error("Error al calcular liquidación:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const liquidarPrestaciones = async (req, res) => {
  try {
    const { profesional_id } = req.params
    const { prestacion_ids, fecha_liquidacion } = req.body

    if (!prestacion_ids || !Array.isArray(prestacion_ids) || prestacion_ids.length === 0) {
      return res.status(400).json({
        error: "Se requiere un array de prestacion_ids para liquidar",
      })
    }

    // Verificar que el profesional existe
    const profesional = await Profesional.findByPk(profesional_id)
    if (!profesional) {
      return res.status(404).json({ error: "Profesional no encontrado" })
    }

    // Actualizar las prestaciones a estado Liquidado
    const [updatedCount] = await Prestacion.update(
      {
        estado: "Liquidado",
        fecha_liquidacion: fecha_liquidacion || new Date(),
      },
      {
        where: {
          id: {
            [Op.in]: prestacion_ids,
          },
          profesional_id,
          estado: "Pendiente",
        },
      },
    )

    if (updatedCount === 0) {
      return res.status(400).json({
        error: "No se encontraron prestaciones pendientes para liquidar",
      })
    }

    // Obtener las prestaciones actualizadas
    const prestacionesLiquidadas = await Prestacion.findAll({
      where: {
        id: {
          [Op.in]: prestacion_ids,
        },
        profesional_id,
      },
      include: [
        {
          model: Paciente,
          as: "paciente",
          attributes: ["id", "nombre", "apellido"],
        },
        {
          model: Servicio,
          as: "servicio",
          attributes: ["id", "nombre"],
        },
        {
          model: SubServicio,
          as: "subservicio",
          attributes: ["id", "nombre"],
        },
      ],
    })

    // Calcular total liquidado
    const totalLiquidado = prestacionesLiquidadas.reduce((sum, p) => sum + Number.parseFloat(p.monto_profesional), 0)

    res.json({
      message: "Prestaciones liquidadas correctamente",
      cantidad_liquidadas: updatedCount,
      total_liquidado: Number.parseFloat(totalLiquidado.toFixed(2)),
      prestaciones: prestacionesLiquidadas,
    })
  } catch (error) {
    console.error("Error al liquidar prestaciones:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const marcarComoPagado = async (req, res) => {
  try {
    const { profesional_id } = req.params
    const { prestacion_ids, fecha_pago } = req.body

    if (!prestacion_ids || !Array.isArray(prestacion_ids) || prestacion_ids.length === 0) {
      return res.status(400).json({
        error: "Se requiere un array de prestacion_ids para marcar como pagado",
      })
    }

    // Actualizar las prestaciones a estado Pagado
    const [updatedCount] = await Prestacion.update(
      {
        estado: "Pagado",
        fecha_pago: fecha_pago || new Date(),
      },
      {
        where: {
          id: {
            [Op.in]: prestacion_ids,
          },
          profesional_id,
          estado: "Liquidado",
        },
      },
    )

    if (updatedCount === 0) {
      return res.status(400).json({
        error: "No se encontraron prestaciones liquidadas para marcar como pagadas",
      })
    }

    res.json({
      message: "Prestaciones marcadas como pagadas correctamente",
      cantidad_pagadas: updatedCount,
    })
  } catch (error) {
    console.error("Error al marcar prestaciones como pagadas:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerResumenProfesional = async (req, res) => {
  try {
    const { profesional_id } = req.params

    // Verificar que el profesional existe
    const profesional = await Profesional.findByPk(profesional_id)
    if (!profesional) {
      return res.status(404).json({ error: "Profesional no encontrado" })
    }

    // Obtener resumen por estado
    const resumenPorEstado = await Prestacion.findAll({
      where: { profesional_id },
      attributes: [
        "estado",
        [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
        [sequelize.fn("SUM", sequelize.col("monto_total")), "monto_total"],
        [sequelize.fn("SUM", sequelize.col("monto_profesional")), "monto_profesional"],
      ],
      group: ["estado"],
    })

    // Obtener prestaciones del mes actual
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const finMes = new Date()
    finMes.setMonth(finMes.getMonth() + 1)
    finMes.setDate(0)
    finMes.setHours(23, 59, 59, 999)

    const prestacionesMesActual = await Prestacion.findAll({
      where: {
        profesional_id,
        fecha: {
          [Op.between]: [inicioMes, finMes],
        },
      },
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
        [sequelize.fn("SUM", sequelize.col("monto_total")), "monto_total"],
        [sequelize.fn("SUM", sequelize.col("monto_profesional")), "monto_profesional"],
      ],
    })

    res.json({
      profesional: {
        id: profesional.id,
        nombre: profesional.nombre,
        apellido: profesional.apellido,
        especialidad: profesional.especialidad,
      },
      resumen_por_estado: resumenPorEstado,
      mes_actual: {
        periodo: {
          desde: inicioMes.toISOString().split("T")[0],
          hasta: finMes.toISOString().split("T")[0],
        },
        ...prestacionesMesActual[0]?.dataValues,
      },
    })
  } catch (error) {
    console.error("Error al obtener resumen del profesional:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarPrestaciones,
  crearPrestacion,
  obtenerPrestacion,
  actualizarPrestacion,
  eliminarPrestacion,
  calcularLiquidacion,
  liquidarPrestaciones,
  marcarComoPagado,
  obtenerResumenProfesional,
}
