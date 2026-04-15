const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { UsuarioPaciente, Paciente, Turno, HistorialClinico, PlanTratamiento, Archivo, Profesional, Servicio, SubServicio, ObraSocial } = require("../models")
const { Op } = require("sequelize")

const registrar = async (email, dni, pacienteId) => {
  const hashedDni = await bcrypt.hash(dni, 10)

  const usuario = await UsuarioPaciente.create({
    email,
    dni_hash: hashedDni,
    paciente_id: pacienteId,
  })

  return usuario
}

const login = async (email, dni) => {
  const usuario = await UsuarioPaciente.findOne({
    where: { email },
    include: [{ model: Paciente, as: "paciente" }],
  })

  if (!usuario) {
    throw new Error("Usuario no encontrado")
  }

  const isValidDni = await bcrypt.compare(dni, usuario.dni_hash)
  if (!isValidDni) {
    throw new Error("Credenciales invalidas")
  }

  const token = jwt.sign(
    {
      usuarioId: usuario.id,
      email: usuario.email,
      role: "paciente",
      pacienteId: usuario.paciente_id,
    },
    process.env.JWT_SECRET || "dental_clinic_secret",
    { expiresIn: "7d" },
  )

  return {
    token,
    usuario: {
      id: usuario.id,
      email: usuario.email,
      pacienteId: usuario.paciente_id,
      nombre: usuario.paciente?.nombre,
      apellido: usuario.paciente?.apellido,
    },
  }
}

const obtenerPerfil = async (pacienteId) => {
  const paciente = await Paciente.findByPk(pacienteId, {
    include: [
      { model: ObraSocial, as: "obraSocial" },
    ],
  })

  if (!paciente) {
    throw new Error("Paciente no encontrado")
  }

  const hoy = new Date().toISOString().split("T")[0]

  const turnos = await Turno.findAll({
    where: { paciente_id: pacienteId },
    include: [
      { model: Profesional, as: "profesional", attributes: ["id", "nombre", "apellido", "especialidad"] },
      { model: Servicio, as: "servicio", attributes: ["id", "nombre"] },
    ],
    order: [["fecha", "DESC"], ["hora_inicio", "DESC"]],
  })

  const proximoTurno = await Turno.findOne({
    where: {
      paciente_id: pacienteId,
      fecha: { [Op.gte]: hoy },
      estado: { [Op.notIn]: ["Cancelado", "Ausente"] },
    },
    include: [
      { model: Profesional, as: "profesional", attributes: ["id", "nombre", "apellido", "especialidad"] },
      { model: Servicio, as: "servicio", attributes: ["id", "nombre"] },
    ],
    order: [["fecha", "ASC"], ["hora_inicio", "ASC"]],
  })

  const historialClinico = await HistorialClinico.findAll({
    where: { paciente_id: pacienteId },
    order: [["createdAt", "DESC"]],
  })

  const planesTratamiento = await PlanTratamiento.findAll({
    where: { paciente_id: pacienteId },
    order: [["createdAt", "DESC"]],
  })

  const archivos = await Archivo.findAll({
    where: { paciente_id: pacienteId },
    order: [["createdAt", "DESC"]],
  })

  const estadisticas = {
    totalTurnos: turnos.length,
    turnosCompletados: turnos.filter((t) => t.estado === "Atendido").length,
    turnosCancelados: turnos.filter((t) => t.estado === "Cancelado").length,
    turnosPendientes: turnos.filter((t) =>
      ["Pendiente", "Confirmado", "Confirmado por email", "Confirmado por SMS", "Confirmado por WhatsApp", "En sala de espera", "Atendiendose"].includes(t.estado)
    ).length,
  }

  return {
    paciente: {
      id: paciente.id,
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      tipo_documento: paciente.tipo_documento,
      numero_documento: paciente.numero_documento,
      fecha_nacimiento: paciente.fecha_nacimiento,
      sexo: paciente.sexo,
      email: paciente.email,
      telefono: paciente.telefono,
      direccion: paciente.direccion,
      obraSocial: paciente.obraSocial ? paciente.obraSocial.nombre : null,
    },
    proximoTurno,
    turnos,
    historialClinico,
    planesTratamiento,
    archivos,
    estadisticas,
  }
}

const buscarPorEmail = async (email) => {
  const usuario = await UsuarioPaciente.findOne({
    where: { email },
    include: [{ model: Paciente, as: "paciente" }],
  })
  return usuario
}

module.exports = {
  registrar,
  login,
  obtenerPerfil,
  buscarPorEmail,
}
