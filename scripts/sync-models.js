require("dotenv").config({ path: __dirname + "/../.env" })
const { sequelize } = require("../src/models")

async function syncModels() {
  try {
    await sequelize.authenticate()
    console.log("Conectado a la base de datos.")
    await sequelize.sync({ alter: true })
    console.log("Modelos sincronizados exitosamente.")
    process.exit(0)
  } catch (error) {
    console.error("Error sincronizando modelos:", error)
    process.exit(1)
  }
}

syncModels()
