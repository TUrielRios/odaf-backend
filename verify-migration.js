require("dotenv").config();
const { Sequelize } = require("sequelize");

// Configuración de base de datos Railway
const railwayDB = new Sequelize({
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
});

async function verifyMigration() {
    try {
        console.log("🔍 Verificando datos migrados en Railway...\n");
        await railwayDB.authenticate();

        const tables = [
            "ObrasSociales",
            "profesionales",
            "servicios",
            "pacientes",
            "copagos",
            "turnos",
            "liquidaciones",
            "movimientos_cuenta"
        ];

        let totalRecords = 0;

        for (const table of tables) {
            try {
                const [result] = await railwayDB.query(`SELECT COUNT(*) as count FROM "${table}"`);
                const count = parseInt(result[0].count);
                totalRecords += count;
                console.log(`✅ ${table.padEnd(25)} → ${count} registros`);
            } catch (error) {
                console.log(`⚠️  ${table.padEnd(25)} → Error: ${error.message}`);
            }
        }

        console.log(`\n📊 Total de registros migrados: ${totalRecords}`);
        console.log("✅ Verificación completada!");
    } catch (error) {
        console.error("❌ Error durante la verificación:", error);
    } finally {
        await railwayDB.close();
    }
}

verifyMigration();
