require("dotenv").config();
const { Sequelize } = require("sequelize");

const db = new Sequelize({
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: true,
});

async function addEmailColumn() {
    try {
        await db.authenticate();
        console.log("✅ Conectado a la base de datos\n");

        // Agregar columna email a la tabla pacientes
        await db.query(`
      ALTER TABLE pacientes 
      ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    `);

        console.log("✅ Columna 'email' agregada exitosamente a la tabla pacientes\n");

        // Agregar columna telefono si no existe
        await db.query(`
      ALTER TABLE pacientes 
      ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);
    `);

        console.log("✅ Columna 'telefono' agregada exitosamente a la tabla pacientes\n");

        console.log("🎉 Migración completada!");
    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await db.close();
    }
}

addEmailColumn();
