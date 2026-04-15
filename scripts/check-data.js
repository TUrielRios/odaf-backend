require("dotenv").config({ path: __dirname + "/../.env" })
const { sequelize, UsuarioPaciente, Paciente } = require("../src/models")

async function checkData() {
  try {
    const usuarios = await UsuarioPaciente.findAll()
    console.log("Usuarios en tabla usuarios_pacientes:", usuarios.length)
    if (usuarios.length > 0) {
      console.log(usuarios.map(u => ({ email: u.email, paciente_id: u.paciente_id })))
    }

    const pacientes = await Paciente.findAll({ limit: 5 })
    console.log("Pacientes de ejemplo:", pacientes.map(p => ({ 
      id: p.id, 
      email: p.email, 
      dni: p.numero_documento,
      nombre: p.nombre,
      apellido: p.apellido
    })))
    
    process.exit(0)
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

checkData()
