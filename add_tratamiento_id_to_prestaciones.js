require("dotenv").config()
const { Sequelize } = require("sequelize")

const db = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: "postgres",
  logging: true,
})

async function run() {
  try {
    await db.authenticate()
    console.log("✅ Conectado a la base de datos\n")

    await db.query(`
      ALTER TABLE prestaciones
      ADD COLUMN IF NOT EXISTS tratamiento_id INTEGER REFERENCES tratamientos(id) ON UPDATE CASCADE ON DELETE SET NULL;
    `)

    console.log("✅ Columna 'tratamiento_id' agregada a prestaciones\n")
    console.log("🎉 Migración completada!")
  } catch (error) {
    console.error("❌ Error:", error.message)
  } finally {
    await db.close()
  }
}

run()
