const { Profesional, ProfesionalServicio, Servicio, Turno } = require("../models")
const { validationResult } = require("express-validator")
const { Op } = require("sequelize")

const listarProfesionales = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", estado = "Activo" } = req.query
    const offset = (page - 1) * limit

    const whereClause = {}

    if (search) {
      whereClause[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { apellido: { [Op.iLike]: `%${search}%` } },
        { numero_matricula: { [Op.iLike]: `%${search}%` } },
        { especialidad: { [Op.iLike]: `%${search}%` } },
      ]
    }

    // Si se especifica un estado, filtrar por él (puede ser vacío para mostrar todos)
    if (estado) {
      whereClause.estado = estado
    }

    const { count, rows } = await Profesional.findAndCountAll({
      where: whereClause,
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [
        ["apellido", "ASC"],
        ["nombre", "ASC"],
      ],
    })

    res.json({
      profesionales: rows,
      pagination: {
        total: count,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    console.error("Error al listar profesionales:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const crearProfesional = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const profesional = await Profesional.create(req.body)
    res.status(201).json(profesional)
  } catch (error) {
    console.error("Error al crear profesional:", error)

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        error: "El número de documento o matrícula ya existe",
      })
    }

    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerProfesional = async (req, res) => {
  try {
    const { id } = req.params

    const profesional = await Profesional.findByPk(id)

    if (!profesional) {
      return res.status(404).json({ error: "Profesional no encontrado" })
    }

    res.json(profesional)
  } catch (error) {
    console.error("Error al obtener profesional:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarProfesional = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params

    const [updatedRowsCount] = await Profesional.update(req.body, {
      where: { id },
    })

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Profesional no encontrado" })
    }

    const profesionalActualizado = await Profesional.findByPk(id)
    res.json(profesionalActualizado)
  } catch (error) {
    console.error("Error al actualizar profesional:", error)

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        error: "El número de documento o matrícula ya existe",
      })
    }

    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarProfesional = async (req, res) => {
  try {
    const { id } = req.params

    // Buscar el profesional
    const profesional = await Profesional.findByPk(id)

    if (!profesional) {
      return res.status(404).json({ error: "Profesional no encontrado" })
    }

    // En lugar de eliminar, marcar como Inactivo (soft delete)
    await profesional.update({ estado: "Inactivo" })

    res.json({
      message: "Profesional marcado como inactivo correctamente",
      profesional: {
        id: profesional.id,
        nombre: profesional.nombre,
        apellido: profesional.apellido,
        estado: profesional.estado
      }
    })
  } catch (error) {
    console.error("Error al eliminar profesional:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}


const obtenerHorariosProfesional = async (req, res) => {
  try {
    const { id } = req.params

    const profesional = await Profesional.findByPk(id)

    if (!profesional) {
      return res.status(404).json({ error: "Profesional no encontrado" })
    }

    // Si el profesional tiene horarios configurados, los devolvemos
    // Si no, devolvemos horarios por defecto
    let horarios = profesional.horarios_atencion

    if (!horarios || Object.keys(horarios).length === 0) {
      // Horarios por defecto
      horarios = {
        lunes: { activo: true, rangos: [{ inicio: "08:00", fin: "17:00" }] },
        martes: { activo: true, rangos: [{ inicio: "08:00", fin: "17:00" }] },
        miercoles: { activo: true, rangos: [{ inicio: "08:00", fin: "17:00" }] },
        jueves: { activo: true, rangos: [{ inicio: "08:00", fin: "17:00" }] },
        viernes: { activo: true, rangos: [{ inicio: "08:00", fin: "17:00" }] },
        sabado: { activo: false, rangos: [{ inicio: "09:00", fin: "13:00" }] },
        domingo: { activo: false, rangos: [{ inicio: "00:00", fin: "00:00" }] },
      }
    }

    res.json({
      profesional_id: Number.parseInt(id),
      horarios: horarios,
    })
  } catch (error) {
    console.error("Error al obtener horarios del profesional:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarHorariosProfesional = async (req, res) => {
  try {
    const { id } = req.params
    const { horarios } = req.body

    // Validar que el profesional existe
    const profesional = await Profesional.findByPk(id)
    if (!profesional) {
      return res.status(404).json({ error: "Profesional no encontrado" })
    }

    // Validar estructura de horarios
    const diasValidos = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]

    for (const dia of diasValidos) {
      if (horarios[dia]) {
        const horario = horarios[dia]

        // Validar que tenga las propiedades requeridas
        if (typeof horario.activo !== "boolean") {
          return res.status(400).json({
            error: `El día ${dia} debe tener la propiedad 'activo' como boolean`,
          })
        }

        if (horario.activo) {
          // Soportar formato nuevo con rangos múltiples
          if (horario.rangos && Array.isArray(horario.rangos)) {
            // Validar que tenga al menos un rango
            if (horario.rangos.length === 0) {
              return res.status(400).json({
                error: `El día ${dia} debe tener al menos un rango de horario cuando está activo`,
              })
            }

            // Validar cada rango
            for (let i = 0; i < horario.rangos.length; i++) {
              const rango = horario.rangos[i]

              if (!rango.inicio || !rango.fin) {
                return res.status(400).json({
                  error: `El día ${dia}, rango ${i + 1}: debe tener horarios de inicio y fin`,
                })
              }

              // Validar formato de hora (HH:MM)
              const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
              if (!timeRegex.test(rango.inicio) || !timeRegex.test(rango.fin)) {
                return res.status(400).json({
                  error: `El día ${dia}, rango ${i + 1}: formato de hora inválido. Use HH:MM`,
                })
              }

              // Validar que la hora de inicio sea menor que la de fin
              const [inicioHora, inicioMin] = rango.inicio.split(":").map(Number)
              const [finHora, finMin] = rango.fin.split(":").map(Number)
              const inicioMinutos = inicioHora * 60 + inicioMin
              const finMinutos = finHora * 60 + finMin

              if (inicioMinutos >= finMinutos) {
                return res.status(400).json({
                  error: `El día ${dia}, rango ${i + 1}: la hora de inicio debe ser menor que la hora de fin`,
                })
              }

              // Validar que los rangos no se superpongan
              for (let j = i + 1; j < horario.rangos.length; j++) {
                const otroRango = horario.rangos[j]
                const [otroInicioHora, otroInicioMin] = otroRango.inicio.split(":").map(Number)
                const [otroFinHora, otroFinMin] = otroRango.fin.split(":").map(Number)
                const otroInicioMinutos = otroInicioHora * 60 + otroInicioMin
                const otroFinMinutos = otroFinHora * 60 + otroFinMin

                // Verificar superposición
                if (
                  (inicioMinutos < otroFinMinutos && finMinutos > otroInicioMinutos) ||
                  (otroInicioMinutos < finMinutos && otroFinMinutos > inicioMinutos)
                ) {
                  return res.status(400).json({
                    error: `El día ${dia}: los rangos ${i + 1} y ${j + 1} se superponen`,
                  })
                }
              }
            }
          } else if (horario.inicio && horario.fin) {
            // Formato antiguo (backward compatibility) - convertir a nuevo formato
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
            if (!timeRegex.test(horario.inicio) || !timeRegex.test(horario.fin)) {
              return res.status(400).json({
                error: `El día ${dia} tiene un formato de hora inválido. Use HH:MM`,
              })
            }

            const [inicioHora, inicioMin] = horario.inicio.split(":").map(Number)
            const [finHora, finMin] = horario.fin.split(":").map(Number)
            const inicioMinutos = inicioHora * 60 + inicioMin
            const finMinutos = finHora * 60 + finMin

            if (inicioMinutos >= finMinutos) {
              return res.status(400).json({
                error: `El día ${dia}: la hora de inicio debe ser menor que la hora de fin`,
              })
            }

            // Convertir al nuevo formato con rangos
            horarios[dia] = {
              activo: horario.activo,
              rangos: [{ inicio: horario.inicio, fin: horario.fin }],
            }
          } else {
            return res.status(400).json({
              error: `El día ${dia} debe tener 'rangos' (array) o 'inicio' y 'fin' cuando está activo`,
            })
          }
        }
      }
    }

    // Actualizar los horarios
    await Profesional.update({ horarios_atencion: horarios }, { where: { id } })

    // Obtener el profesional actualizado
    const profesionalActualizado = await Profesional.findByPk(id)

    res.json({
      profesional_id: Number.parseInt(id),
      horarios: profesionalActualizado.horarios_atencion,
      message: "Horarios actualizados correctamente",
    })
  } catch (error) {
    console.error("Error al actualizar horarios del profesional:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerHorariosDisponibles = async (req, res) => {
  try {
    const { id } = req.params
    const { fecha } = req.query

    if (!fecha) {
      return res.status(400).json({ error: "La fecha es requerida" })
    }

    const profesional = await Profesional.findByPk(id)
    if (!profesional) {
      return res.status(404).json({ error: "Profesional no encontrado" })
    }

    // Obtener el día de la semana
    const fechaObj = new Date(fecha + "T00:00:00")
    // getDay() devuelve: 0=domingo, 1=lunes, 2=martes, 3=miercoles, 4=jueves, 5=viernes, 6=sabado
    const diasSemana = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
    const diaSemana = diasSemana[fechaObj.getDay()]

    // Obtener horarios del profesional
    let horarios = profesional.horarios_atencion
    if (!horarios || Object.keys(horarios).length === 0) {
      // Horarios por defecto
      horarios = {
        lunes: { activo: true, rangos: [{ inicio: "08:00", fin: "17:00" }] },
        martes: { activo: true, rangos: [{ inicio: "08:00", fin: "17:00" }] },
        miercoles: { activo: true, rangos: [{ inicio: "08:00", fin: "17:00" }] },
        jueves: { activo: true, rangos: [{ inicio: "08:00", fin: "17:00" }] },
        viernes: { activo: true, rangos: [{ inicio: "08:00", fin: "17:00" }] },
        sabado: { activo: false, rangos: [{ inicio: "09:00", fin: "13:00" }] },
        domingo: { activo: false, rangos: [{ inicio: "00:00", fin: "00:00" }] },
      }
    }

    const horarioDia = horarios[diaSemana]

    if (!horarioDia || !horarioDia.activo) {
      return res.json({
        disponible: false,
        mensaje: `El profesional no atiende los ${diaSemana}s`,
        horarios_disponibles: [],
      })
    }

    // Generar slots de tiempo cada 30 minutos para cada rango
    const generarSlots = (inicio, fin) => {
      const slots = []
      const [inicioHora, inicioMin] = inicio.split(":").map(Number)
      const [finHora, finMin] = fin.split(":").map(Number)

      let currentHora = inicioHora
      let currentMin = inicioMin

      while (currentHora < finHora || (currentHora === finHora && currentMin < finMin)) {
        const timeString = `${currentHora.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`
        slots.push(timeString)

        currentMin += 30
        if (currentMin >= 60) {
          currentMin = 0
          currentHora += 1
        }
      }

      return slots
    }

    let slotsDisponibles = []

    // Soportar formato nuevo con rangos múltiples
    if (horarioDia.rangos && Array.isArray(horarioDia.rangos)) {
      // Generar slots para cada rango y combinarlos
      for (const rango of horarioDia.rangos) {
        const slotsRango = generarSlots(rango.inicio, rango.fin)
        slotsDisponibles = [...slotsDisponibles, ...slotsRango]
      }
    } else if (horarioDia.inicio && horarioDia.fin) {
      // Formato antiguo (backward compatibility)
      slotsDisponibles = generarSlots(horarioDia.inicio, horarioDia.fin)
    }

    // Filtrar slots ya ocupados consultando la tabla de turnos
    const turnosExistentes = await Turno.findAll({
      where: {
        profesional_id: id,
        fecha: fecha,
        estado: { [Op.ne]: "Cancelado" }, // Excluir turnos cancelados
      },
      attributes: ["hora_inicio", "hora_fin"],
    })

    console.log(`[DEBUG] Fecha: ${fecha}, Profesional ID: ${id}`)
    console.log(`[DEBUG] Turnos existentes encontrados: ${turnosExistentes.length}`)
    if (turnosExistentes.length > 0) {
      turnosExistentes.forEach(turno => {
        console.log(`[DEBUG] Turno: ${turno.hora_inicio} - ${turno.hora_fin}`)
      })
    }
    console.log(`[DEBUG] Slots totales generados: ${slotsDisponibles.length}`)

    // Función para verificar si un slot está ocupado
    const isSlotOcupado = (slot) => {
      // Convertir el slot a minutos para comparación
      const [slotHora, slotMin] = slot.split(":").map(Number)
      const slotInicioMinutos = slotHora * 60 + slotMin
      const slotFinMinutos = slotInicioMinutos + 30 // Asumimos slots de 30 minutos

      // Verificar si este slot se superpone con algún turno existente
      for (const turno of turnosExistentes) {
        const [turnoInicioHora, turnoInicioMin, turnoInicioSeg] = turno.hora_inicio.split(":").map(Number)
        const [turnoFinHora, turnoFinMin, turnoFinSeg] = turno.hora_fin.split(":").map(Number)

        const turnoInicioMinutos = turnoInicioHora * 60 + turnoInicioMin
        const turnoFinMinutos = turnoFinHora * 60 + turnoFinMin

        // Verificar superposición:
        // Un slot está ocupado si:
        // 1. El slot comienza durante un turno existente
        // 2. El slot termina durante un turno existente
        // 3. El slot contiene completamente el turno existente
        if (
          (slotInicioMinutos >= turnoInicioMinutos && slotInicioMinutos < turnoFinMinutos) ||
          (slotFinMinutos > turnoInicioMinutos && slotFinMinutos <= turnoFinMinutos) ||
          (slotInicioMinutos <= turnoInicioMinutos && slotFinMinutos >= turnoFinMinutos)
        ) {
          console.log(`[DEBUG] Slot ${slot} está ocupado por turno ${turno.hora_inicio}-${turno.hora_fin}`)
          return true
        }
      }
      return false
    }

    // Filtrar los slots disponibles
    const slotsLibres = slotsDisponibles.filter(slot => !isSlotOcupado(slot))
    console.log(`[DEBUG] Slots libres después del filtro: ${slotsLibres.length}`)

    res.json({
      disponible: slotsLibres.length > 0,
      mensaje: slotsLibres.length > 0
        ? "Horarios disponibles encontrados"
        : "No hay horarios disponibles para esta fecha",
      horarios_disponibles: slotsLibres,
      horario_atencion: horarioDia,
    })
  } catch (error) {
    console.error("Error al obtener horarios disponibles:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerServiciosProfesional = async (req, res) => {
  try {
    const { id } = req.params

    const profesional = await Profesional.findByPk(id, {
      include: [
        {
          model: Servicio,
          as: "servicios",
          through: {
            attributes: ["estado", "createdAt"],
            where: { estado: "Activo" },
          },
          attributes: ["id", "nombre", "descripcion", "precio_base", "duracion_estimada", "categoria"],
        },
      ],
    })

    if (!profesional) {
      return res.status(404).json({ error: "Profesional no encontrado" })
    }

    res.json({
      profesional_id: Number.parseInt(id),
      servicios: profesional.servicios,
    })
  } catch (error) {
    console.error("Error al obtener servicios del profesional:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const asignarServicioAProfesional = async (req, res) => {
  try {
    const { id } = req.params
    const { servicio_id, servicio_ids } = req.body

    // Determinar qué IDs procesar
    const idsAProcesar = servicio_ids && Array.isArray(servicio_ids) ? servicio_ids : servicio_id ? [servicio_id] : []

    if (idsAProcesar.length === 0) {
      return res.status(400).json({ error: "El servicio_id es requerido" })
    }

    // Verificar que el profesional existe
    const profesional = await Profesional.findByPk(id)
    if (!profesional) {
      return res.status(404).json({ error: "Profesional no encontrado" })
    }

    const resultados = []
    const errores = []

    for (const servicioId of idsAProcesar) {
      // Verificar que el servicio existe
      const servicio = await Servicio.findByPk(servicioId)
      if (!servicio) {
        errores.push(`Servicio ${servicioId} no encontrado`)
        continue
      }

      // Verificar si ya existe la relación
      const relacionExistente = await ProfesionalServicio.findOne({
        where: {
          profesional_id: id,
          servicio_id: servicioId,
        },
      })

      if (relacionExistente) {
        // Si existe pero está inactiva, activarla
        if (relacionExistente.estado === "Inactivo") {
          await relacionExistente.update({ estado: "Activo" })
          resultados.push({ servicio_id: servicioId, mensaje: "Reactivado" })
        } else {
          errores.push(`Servicio ${servicioId} ya está asignado`)
        }
      } else {
        // Crear la relación
        await ProfesionalServicio.create({
          profesional_id: id,
          servicio_id: servicioId,
          estado: "Activo",
        })
        resultados.push({ servicio_id: servicioId, mensaje: "Asignado" })
      }
    }

    const profesionalActualizado = await Profesional.findByPk(id, {
      include: [
        {
          model: Servicio,
          as: "servicios",
          through: {
            attributes: ["estado", "createdAt"],
            where: { estado: "Activo" },
          },
          attributes: ["id", "nombre", "descripcion", "precio_base", "duracion_estimada", "categoria"],
        },
      ],
    })

    res.status(201).json({
      message: "Servicios procesados correctamente",
      resultados: resultados,
      errores: errores.length > 0 ? errores : undefined,
      servicios: profesionalActualizado.servicios,
    })
  } catch (error) {
    console.error("Error al asignar servicio al profesional:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const removerServicioDeProfesional = async (req, res) => {
  try {
    const { id, servicio_id } = req.params

    const relacion = await ProfesionalServicio.findOne({
      where: {
        profesional_id: id,
        servicio_id: servicio_id,
      },
    })

    if (!relacion) {
      return res.status(404).json({ error: "Relación no encontrada" })
    }

    // Marcar como inactiva en lugar de eliminar (soft delete)
    await relacion.update({ estado: "Inactivo" })

    res.json({ message: "Servicio removido del profesional correctamente" })
  } catch (error) {
    console.error("Error al remover servicio del profesional:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarComision = async (req, res) => {
  try {
    const { id } = req.params
    const { porcentaje_comision } = req.body

    if (porcentaje_comision === undefined || porcentaje_comision === null) {
      return res.status(400).json({ error: "El porcentaje de comisión es requerido" })
    }

    if (porcentaje_comision < 0 || porcentaje_comision > 100) {
      return res.status(400).json({ error: "El porcentaje de comisión debe estar entre 0 y 100" })
    }

    const profesional = await Profesional.findByPk(id)
    if (!profesional) {
      return res.status(404).json({ error: "Profesional no encontrado" })
    }

    await profesional.update({ porcentaje_comision })

    res.json({
      message: "Porcentaje de comisión actualizado correctamente",
      profesional_id: Number.parseInt(id),
      porcentaje_comision: profesional.porcentaje_comision,
    })
  } catch (error) {
    console.error("Error al actualizar comisión:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarProfesionales,
  crearProfesional,
  obtenerProfesional,
  actualizarProfesional,
  eliminarProfesional,
  obtenerHorariosProfesional,
  actualizarHorariosProfesional,
  obtenerHorariosDisponibles,
  obtenerServiciosProfesional,
  asignarServicioAProfesional,
  removerServicioDeProfesional,
  actualizarComision, // Exportando nueva función
}
