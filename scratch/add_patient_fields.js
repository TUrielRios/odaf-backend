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

async function addPatientFields() {
    try {
        await db.authenticate();
        console.log("✅ Conectado a la base de datos\n");

        await db.query(`
          ALTER TABLE pacientes 
          ADD COLUMN IF NOT EXISTS numero_afiliado VARCHAR(255);
        `);
        console.log("✅ Columna 'numero_afiliado' agregada exitosamente\n");

        await db.query(`
          ALTER TABLE pacientes 
          ADD COLUMN IF NOT EXISTS condicion_iva VARCHAR(255);
        `);
        console.log("✅ Columna 'condicion_iva' agregada exitosamente\n");

        console.log("🎉 Migración completada!");
    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await db.close();
    }
}

addPatientFields();
