require("dotenv").config({ path: __dirname + "/../.env" })
const bcrypt = require("bcryptjs")
const { sequelize, Paciente, UsuarioPaciente } = require("../src/models")

async function syncUsuariosPacientesFast() {
  try {
    const pacientes = await Paciente.findAll({
      where: {
        email: {
          [sequelize.Sequelize.Op.not]: null,
          [sequelize.Sequelize.Op.ne]: ''
        }
      },
      order: [['createdAt', 'DESC']] // Para quedarnos con el paciente mas reciente en caso de email duplicado
    })

    console.log(`Se encontraron ${pacientes.length} pacientes con email en total.`)

    // Eliminar duplicados por email en la misma lista de pacientes
    const emailToPaciente = new Map()
    for (const p of pacientes) {
      if (!emailToPaciente.has(p.email)) {
        emailToPaciente.set(p.email, p)
      }
    }
    
    const pacientesUnicos = Array.from(emailToPaciente.values())
    console.log(`Se filtraron y quedaron ${pacientesUnicos.length} pacientes con email unico.`)

    // Obtener los correos que ya existen en UsuarioPaciente
    const usuariosExistentes = await UsuarioPaciente.findAll({ attributes: ['email'] })
    const setEmailsExistentes = new Set(usuariosExistentes.map(u => u.email))

    const pacientesParaCrear = pacientesUnicos.filter(p => !setEmailsExistentes.has(p.email))
    console.log(`Hay ${pacientesParaCrear.length} pacientes pendientes de creacion.`)

    const batchSize = 25
    for (let i = 0; i < pacientesParaCrear.length; i += batchSize) {
      const batch = pacientesParaCrear.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (paciente) => {
        try {
          const dniHash = await bcrypt.hash(paciente.numero_documento, 10)
          await UsuarioPaciente.create({
            email: paciente.email,
            dni_hash: dniHash,
            paciente_id: paciente.id,
          })
        } catch (err) {
          console.error(`Error creando usuario para ${paciente.email}: ${err.message}`)
        }
      }))
      
      console.log(`Procesados ${Math.min(i + batchSize, pacientesParaCrear.length)} / ${pacientesParaCrear.length}`)
    }

    console.log(`\nCompletado!`)
    process.exit(0)
  } catch (error) {
    console.error("Error general sincronizando:", error)
    process.exit(1)
  }
}

syncUsuariosPacientesFast()
