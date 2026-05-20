const app = require("./app")
const { sequelize } = require("./models")
const { seedUsuarios } = require("./seeds/seedUsuarios")

const PORT = process.env.PORT

async function startServer() {
  try {
    // Verificar conexión a la base de datos
    await sequelize.authenticate()
    console.log("✅ Conexión a la base de datos establecida correctamente.")

    // Sincronizar modelos (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true, force: false })
      console.log("✅ Modelos sincronizados con la base de datos.")
    }

    // Seed de usuarios (crea solo si no existen)
    await seedUsuarios()

    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`)
    })
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error)
    process.exit(1)
  }
}

startServer()
