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

async function checkEmailColumn() {
    try {
        await db.authenticate();
        console.log("✅ Conectado a la base de datos\n");

        const [columns] = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pacientes'
      ORDER BY ordinal_position;
    `);

        console.log("📋 Columnas en la tabla pacientes:\n");
        columns.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });

        const hasEmail = columns.some(col => col.column_name === 'email');

        if (hasEmail) {
            console.log("\n✅ La columna 'email' existe en la tabla pacientes");
        } else {
            console.log("\n⚠️  La columna 'email' NO existe en la tabla pacientes");
            console.log("   Se necesita agregar esta columna para enviar emails de confirmación");
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await db.close();
    }
}

checkEmailColumn();
