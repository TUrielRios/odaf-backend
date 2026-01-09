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
    dialectOptions: {
        connectTimeout: 10000
    }
});

async function resetSequences() {
    try {
        console.log("🔧 Conectando a Railway...");
        await db.authenticate();
        console.log("✅ Conectado!\n");

        const queries = [
            `SELECT setval('movimientos_cuenta_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM movimientos_cuenta), false)`,
            `SELECT setval('turnos_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM turnos), false)`,
            `SELECT setval('pacientes_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM pacientes), false)`,
            `SELECT setval('profesionales_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM profesionales), false)`,
            `SELECT setval('servicios_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM servicios), false)`,
            `SELECT setval('"ObrasSociales_id_seq"', (SELECT COALESCE(MAX(id), 0) + 1 FROM "ObrasSociales"), false)`,
            `SELECT setval('liquidaciones_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM liquidaciones), false)`,
            `SELECT setval('copagos_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM copagos), false)`
        ];

        console.log("🔧 Reseteando secuencias...\n");

        for (const query of queries) {
            try {
                await db.query(query);
                const tableName = query.match(/'([^']+)_id_seq'/)[1];
                console.log(`✅ ${tableName}`);
            } catch (error) {
                console.log(`⚠️  Error: ${error.message}`);
            }
        }

        console.log("\n🎉 ¡Secuencias reseteadas correctamente!");
        console.log("\nAhora puedes intentar registrar un movimiento nuevamente.");
    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        try {
            await db.close();
        } catch (e) { }
    }
}

resetSequences().catch(console.error);
