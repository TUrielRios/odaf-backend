require("dotenv").config();
const { Sequelize } = require("sequelize");

const db = new Sequelize({
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
});

async function migrate() {
    try {
        await db.authenticate();
        console.log("✅ Conectado a la base de datos\n");

        // Foto del paciente
        await db.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500);`);
        console.log("✅ Columna 'foto_url' agregada a pacientes\n");

        // Tabla de feriados
        await db.query(`
          CREATE TABLE IF NOT EXISTS feriados (
            id SERIAL PRIMARY KEY,
            fecha DATE NOT NULL UNIQUE,
            descripcion VARCHAR(255),
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);
        console.log("✅ Tabla 'feriados' creada\n");

        console.log("🎉 Migración completada!");
    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await db.close();
    }
}

migrate();
