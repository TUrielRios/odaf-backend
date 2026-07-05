const { PlanTratamiento, Paciente, Profesional, ObraSocial, Procedimiento, ProcedimientoPrecioObraSocial, Tratamiento, Prestacion } = require("../models")
const { validationResult } = require("express-validator")

// Helper para obtener plan con includes completos (incluye tratamientos de la tabla)
const getPlanWithIncludes = async (id) => {
  return PlanTratamiento.findByPk(id, {
    include: [
      {
        model: Paciente,
        as: "paciente",
        attributes: ["id", "nombre", "apellido", "numero_documento", "obra_social_id"],
      },
      {
        model: Profesional,
        as: "profesional",
        attributes: ["id", "nombre", "apellido", "especialidad"],
      },
      {
        model: ObraSocial,
        as: "obraSocial",
        attributes: ["id", "nombre", "plan"],
      },
      {
        model: Tratamiento,
        as: "tratamientosItems",
        include: [
          {
            model: Procedimiento,
            as: "procedimiento",
            attributes: ["id", "nombre", "precio_ars", "precio_usd"],
          },
          {
            model: Profesional,
            as: "profesional",
            attributes: ["id", "nombre", "apellido", "especialidad"],
          },
        ],
        order: [["fecha_inicio", "ASC"]],
      },
    ],
  })
}

const listarPlanesTratamiento = async (req, res) => {
  try {
    const { paciente_id, profesional_id, estado } = req.query

    const whereClause = {}

    if (paciente_id) {
      whereClause.paciente_id = paciente_id
    }

    if (profesional_id) {
      whereClause.profesional_id = profesional_id
    }

    if (estado) {
      whereClause.estado = estado
    }

    const planes = await PlanTratamiento.findAll({
      where: whereClause,
      include: [
        {
          model: Paciente,
          as: "paciente",
          attributes: ["id", "nombre", "apellido", "numero_documento", "obra_social_id"],
        },
        {
          model: Profesional,
          as: "profesional",
          attributes: ["id", "nombre", "apellido", "especialidad"],
        },
        {
          model: ObraSocial,
          as: "obraSocial",
          attributes: ["id", "nombre", "plan"],
        },
        {
          model: Tratamiento,
          as: "tratamientosItems",
          include: [
            {
              model: Procedimiento,
              as: "procedimiento",
              attributes: ["id", "nombre", "precio_ars", "precio_usd"],
            },
            {
              model: Profesional,
              as: "profesional",
              attributes: ["id", "nombre", "apellido", "especialidad"],
            },
          ],
        },
      ],
      order: [["fecha_creacion", "DESC"]],
    })

    res.json(planes)
  } catch (error) {
    console.error("Error al listar planes de tratamiento:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const recalcularPlanTratamiento = async (planId) => {
  const tratamientos = await Tratamiento.findAll({
    where: { plan_tratamiento_id: planId }
  })

  if (!tratamientos || tratamientos.length === 0) {
    // Si no hay tratamientos, volver al estado inicial/Planificado y costos en cero
    await PlanTratamiento.update(
      {
        costo_paciente: 0,
        costo_obra_social: 0,
        costo_estimado: 0,
        costo_total: 0,
        estado: "Planificado",
        fecha_inicio: new Date().toISOString().split("T")[0],
        fecha_fin: null
      },
      { where: { id: planId } }
    )
    return
  }

  let costoPaciente = 0
  let costoObraSocial = 0
  let minFechaInicio = null
  let maxFechaTerminado = null
  
  let totalCount = tratamientos.length
  let pendienteCount = 0
  let comenzadoCount = 0
  let canceladoCount = 0
  let terminadoCount = 0

  for (const t of tratamientos) {
    costoPaciente += parseFloat(t.precio_paciente) || 0
    costoObraSocial += parseFloat(t.cobertura_obra_social) || 0

    if (t.fecha_inicio) {
      if (!minFechaInicio || t.fecha_inicio < minFechaInicio) {
        minFechaInicio = t.fecha_inicio
      }
    }

    if (t.estado === "Pendiente") pendienteCount++
    else if (t.estado === "Comenzado") comenzadoCount++
    else if (t.estado === "Cancelado") canceladoCount++
    else if (t.estado === "Terminado") {
      terminadoCount++
      if (t.fecha_inicio && (!maxFechaTerminado || t.fecha_inicio > maxFechaTerminado)) {
        maxFechaTerminado = t.fecha_inicio
      }
    }
  }

  // Determinar estado del plan
  let nuevoEstado = "Planificado"
  let fechaFin = null

  if (terminadoCount + canceladoCount === totalCount) {
    if (terminadoCount > 0) {
      nuevoEstado = "Completado"
      fechaFin = maxFechaTerminado || new Date().toISOString().split("T")[0]
    } else {
      nuevoEstado = "Cancelado"
    }
  } else if (comenzadoCount > 0 || terminadoCount > 0) {
    nuevoEstado = "En_Progreso"
  } else if (pendienteCount === totalCount) {
    nuevoEstado = "Pendiente"
  }

  const costoTotal = costoPaciente + costoObraSocial

  await PlanTratamiento.update(
    {
      costo_paciente: costoPaciente,
      costo_obra_social: costoObraSocial,
      costo_estimado: costoTotal,
      costo_total: costoTotal,
      estado: nuevoEstado,
      fecha_inicio: minFechaInicio || new Date().toISOString().split("T")[0],
      fecha_fin: fechaFin
    },
    { where: { id: planId } }
  )
}

const crearPlanTratamiento = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // Inicializar plan con datos por defecto. El usuario solo provee descripcion (Nombre del plan).
    const planData = {
      ...req.body,
      fecha_inicio: new Date().toISOString().split("T")[0],
      estado: "Planificado",
      costo_estimado: 0,
      costo_total: 0,
      costo_paciente: 0,
      costo_obra_social: 0
    }

    const plan = await PlanTratamiento.create(planData)
    const planCompleto = await getPlanWithIncludes(plan.id)

    res.status(201).json(planCompleto)
  } catch (error) {
    console.error("Error al crear plan de tratamiento:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerPlanTratamiento = async (req, res) => {
  try {
    const { id } = req.params

    const plan = await getPlanWithIncludes(id)

    if (!plan) {
      return res.status(404).json({ error: "Plan de tratamiento no encontrado" })
    }

    res.json(plan)
  } catch (error) {
    console.error("Error al obtener plan de tratamiento:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarPlanTratamiento = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params

    // Al actualizar el plan, solo se permite modificar la descripción (Nombre del plan) y las observaciones.
    // Los demás campos se calculan automáticamente según los tratamientos agregados.
    const allowedUpdates = {}
    if (req.body.descripcion !== undefined) allowedUpdates.descripcion = req.body.descripcion
    if (req.body.observaciones !== undefined) allowedUpdates.observaciones = req.body.observaciones

    const [updatedRowsCount] = await PlanTratamiento.update(allowedUpdates, {
      where: { id },
    })

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Plan de tratamiento no encontrado" })
    }

    const planActualizado = await getPlanWithIncludes(id)

    res.json(planActualizado)
  } catch (error) {
    console.error("Error al actualizar plan de tratamiento:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarPlanTratamiento = async (req, res) => {
  try {
    const { id } = req.params

    const deletedRowsCount = await PlanTratamiento.destroy({
      where: { id },
    })

    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: "Plan de tratamiento no encontrado" })
    }

    res.json({ message: "Plan de tratamiento eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar plan de tratamiento:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Tratamientos individuales (tabla separada `tratamientos`)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Agrega un tratamiento al plan. Resuelve precios automáticamente
 * según la obra social del paciente y el procedimiento seleccionado.
 */
const agregarTratamiento = async (req, res) => {
  try {
    const { id } = req.params
    const {
      procedimiento_id,
      nomenclador,
      pieza_numero,
      pieza_superficies,
      fecha_inicio,
    } = req.body

    if (!procedimiento_id || !nomenclador || !fecha_inicio) {
      return res.status(400).json({
        error: "Se requieren procedimiento_id, nomenclador y fecha_inicio",
      })
    }

    const plan = await getPlanWithIncludes(id)
    if (!plan) {
      return res.status(404).json({ error: "Plan de tratamiento no encontrado" })
    }

    // Obtener datos del procedimiento con precios por obra social
    const procedimiento = await Procedimiento.findByPk(procedimiento_id, {
      include: [
        {
          model: ProcedimientoPrecioObraSocial,
          as: "preciosObraSocial",
          include: [{ model: ObraSocial, as: "obraSocial", attributes: ["id", "nombre"] }],
        },
      ],
    })

    if (!procedimiento) {
      return res.status(404).json({ error: "Procedimiento no encontrado" })
    }

    // Resolver precios según la obra social del paciente
    const obraSocialId = plan.paciente?.obra_social_id || plan.obra_social_id
    let precioPaciente = parseFloat(procedimiento.precio_ars) || 0
    let coberturaObraSocial = 0

    if (obraSocialId && procedimiento.preciosObraSocial) {
      const precioOS = procedimiento.preciosObraSocial.find(
        (p) => p.obra_social_id === obraSocialId
      )
      if (precioOS) {
        coberturaObraSocial = parseFloat(precioOS.cobertura) || 0
        if (!precioOS.usar_precio_particular && precioOS.precio_paciente !== null) {
          precioPaciente = parseFloat(precioOS.precio_paciente) || 0
        }
      }
    }

    // Crear el tratamiento en la tabla
    await Tratamiento.create({
      plan_tratamiento_id: plan.id,
      procedimiento_id: procedimiento.id,
      nomenclador,
      pieza_numero: nomenclador === "Pieza" ? pieza_numero : null,
      pieza_superficies: nomenclador === "Pieza" ? (pieza_superficies || {}) : null,
      fecha_inicio,
      estado: "Pendiente",
      precio_paciente: precioPaciente,
      cobertura_obra_social: coberturaObraSocial,
      autorizado: false,
    })

    // Recalcular costos, fechas y estado del plan
    await recalcularPlanTratamiento(plan.id)

    const planActualizado = await getPlanWithIncludes(id)
    res.status(201).json(planActualizado)
  } catch (error) {
    console.error("Error al agregar tratamiento al plan:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

/**
 * Actualiza un tratamiento específico (por ID de la tabla).
 * Si el estado cambia a "Terminado", crea automáticamente una Prestación
 * para la liquidación del profesional.
 */
const actualizarTratamiento = async (req, res) => {
  try {
    const { id, tratamientoId } = req.params
    const updates = req.body

    const plan = await getPlanWithIncludes(id)
    if (!plan) {
      return res.status(404).json({ error: "Plan de tratamiento no encontrado" })
    }

    const tratamiento = await Tratamiento.findOne({
      where: { id: tratamientoId, plan_tratamiento_id: id },
    })

    if (!tratamiento) {
      return res.status(404).json({ error: "Tratamiento no encontrado en el plan" })
    }

    const estadoAnterior = tratamiento.estado

    // Actualizar el tratamiento
    await tratamiento.update(updates)

    // Si el estado cambió a "Terminado", crear Prestación automáticamente para liquidación
    if (updates.estado === "Terminado" && estadoAnterior !== "Terminado") {
      const profesionalId = tratamiento.profesional_id || updates.profesional_id
      if (profesionalId) {
        // Obtener porcentaje de comisión del profesional
        const profesional = await Profesional.findByPk(profesionalId)
        const porcentajeProfesional = profesional?.porcentaje_comision || 50

        const montoTotal = (parseFloat(tratamiento.precio_paciente) || 0) + (parseFloat(tratamiento.cobertura_obra_social) || 0)
        const montoProfesional = (montoTotal * porcentajeProfesional) / 100

        await Prestacion.create({
          profesional_id: profesionalId,
          paciente_id: plan.paciente_id,
          tratamiento_id: tratamiento.id,
          fecha: tratamiento.fecha_inicio,
          descripcion: `Tratamiento: ${tratamiento.procedimiento_id ? (await Procedimiento.findByPk(tratamiento.procedimiento_id))?.nombre : "Sin procedimiento"} - ${tratamiento.nomenclador}${tratamiento.pieza_numero ? ` (Pieza ${tratamiento.pieza_numero})` : ""}`,
          monto_total: montoTotal,
          porcentaje_profesional: porcentajeProfesional,
          monto_profesional: parseFloat(montoProfesional.toFixed(2)),
          estado: "Pendiente",
          observaciones: `Generado automáticamente desde Plan de Tratamiento #${plan.id}`,
        })
      }
    }

    // Recalcular costos, fechas y estado del plan
    await recalcularPlanTratamiento(id)

    const planActualizado = await getPlanWithIncludes(id)
    res.json(planActualizado)
  } catch (error) {
    console.error("Error al actualizar tratamiento del plan:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

/**
 * Elimina un tratamiento específico del plan (por ID de la tabla).
 */
const eliminarTratamiento = async (req, res) => {
  try {
    const { id, tratamientoId } = req.params

    const tratamiento = await Tratamiento.findOne({
      where: { id: tratamientoId, plan_tratamiento_id: id },
    })

    if (!tratamiento) {
      return res.status(404).json({ error: "Tratamiento no encontrado en el plan" })
    }

    await tratamiento.destroy()

    // Recalcular costos, fechas y estado del plan
    await recalcularPlanTratamiento(id)

    const planActualizado = await getPlanWithIncludes(id)
    res.json(planActualizado)
  } catch (error) {
    console.error("Error al eliminar tratamiento del plan:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarPlanesTratamiento,
  crearPlanTratamiento,
  obtenerPlanTratamiento,
  actualizarPlanTratamiento,
  eliminarPlanTratamiento,
  agregarTratamiento,
  actualizarTratamiento,
  eliminarTratamiento,
}
