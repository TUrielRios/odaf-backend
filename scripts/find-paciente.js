require("dotenv").config({ path: __dirname + "/../.env" })
const { sequelize, Paciente } = require("../src/models")

async function findPaciente() {
  try {
    const paciente = await Paciente.findOne({ where: { email: 'riostiziano6@gmail.com' } })
    console.log("Paciente con email riostiziano6@gmail.com:", paciente ? paciente.toJSON() : "No encontrado")
    
    const pacienteByNombre = await Paciente.findOne({ where: { nombre: 'Tiziano' } })
    console.log("Paciente con nombre Tiziano:", pacienteByNombre ? pacienteByNombre.toJSON() : "No encontrado")
    
    process.exit(0)
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

findPaciente()
