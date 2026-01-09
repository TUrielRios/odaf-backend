require("dotenv").config();
const { Sequelize } = require("sequelize");

// Configuración de base de datos local
const localDB = new Sequelize({
    database: "odaf_turnos",
    username: "postgres",
    password: "admin",
    host: "localhost",
    port: 5432,
    dialect: "postgres",
    logging: false,
});

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

async function migrateTables() {
    try {
        console.log("🔍 Conectando a ambas bases de datos...");
        await localDB.authenticate();
        await railwayDB.authenticate();
        console.log("✅ Conexiones establecidas.\n");

        // Definir orden de tablas según dependencias (tablas padre primero)
        const tableOrder = [
            "SequelizeMeta",
            "configuracion_sistemas",
            "ObrasSociales",
            "profesionales",
            "servicios",
            "pacientes",
            "copagos",
            "profesional_servicios",
            "horarios_atencion",
            "disponibilidad_profesionales",
            "turnos",
            "recordatorios",
            "precios_servicios",
            "liquidaciones",
            "detalle_liquidaciones",
            "movimientos_cuenta",
            "pagos_turnos"
        ];

        console.log(`📋 Tablas a migrar: ${tableOrder.length}\n`);

        // Temporalmente deshabilitar triggers de foreign keys en Railway
        console.log("⚠️  Deshabilitando restricciones de claves foráneas temporalmente...");
        await railwayDB.query("SET session_replication_role = 'replica';");

        for (const table_name of tableOrder) {
            try {
                console.log(`📦 Migrando tabla: ${table_name}`);

                // Verificar si la tabla existe
                const [tableExists] = await localDB.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${table_name}'
          );
        `);

                if (!tableExists[0].exists) {
                    console.log(`   ℹ️  Tabla no existe, omitiendo...`);
                    continue;
                }

                // Leer datos de la tabla local
                const [rows] = await localDB.query(`SELECT * FROM "${table_name}"`);

                if (rows.length === 0) {
                    console.log(`   ℹ️  Tabla vacía, omitiendo...`);
                    continue;
                }

                console.log(`   📊 Registros encontrados: ${rows.length}`);

                // Limpiar tabla en Railway
                await railwayDB.query(`TRUNCATE TABLE "${table_name}" CASCADE`);

                // Insertar datos en lotes
                const batchSize = 100;
                for (let i = 0; i < rows.length; i += batchSize) {
                    const batch = rows.slice(i, i + batchSize);

                    for (const row of batch) {
                        const columns = Object.keys(row).map(col => `"${col}"`).join(", ");
                        const placeholders = Object.keys(row).map((_, idx) => `$${idx + 1}`).join(", ");
                        const values = Object.values(row).map(val => {
                            if (val === null) return null;
                            if (val instanceof Date) return val;
                            return val;
                        });

                        await railwayDB.query(
                            `INSERT INTO "${table_name}" (${columns}) VALUES (${placeholders})`,
                            { bind: values }
                        );
                    }

                    const progress = Math.min(i + batchSize, rows.length);
                    console.log(`   ⏳ Progreso: ${progress}/${rows.length}`);
                }

                console.log(`   ✅ ${rows.length} registros migrados\n`);
            } catch (error) {
                console.error(`   ❌ Error migrando ${table_name}:`, error.message);
            }
        }

        // Rehabilitar triggers de foreign keys
        console.log("✅ Rehabilitando restricciones de claves foráneas...");
        await railwayDB.query("SET session_replication_role = 'origin';");

        console.log("\n🎉 Migración completada!");
    } catch (error) {
        console.error("❌ Error durante la migración:", error);
        // Asegurar que se rehabiliten las restricciones incluso si hay error
        try {
            await railwayDB.query("SET session_replication_role = 'origin';");
        } catch (e) { }
    } finally {
        await localDB.close();
        await railwayDB.close();
    }
}

migrateTables();
