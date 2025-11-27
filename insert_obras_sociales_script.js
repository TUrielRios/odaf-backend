// Script to insert obras sociales into the database
// Run this with: node insert_obras_sociales_script.js

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
    }
);

const obrasSociales = [
    'Ioma',
    'Osmecon',
    'Casa Circulo 51',
    'Particular',
    'Galeno',
    'Recetas',
    'Assist Dent',
    'Amebpba Circulo 22',
    'Poder Judicial',
    'Sancor Salud',
    'Staff Medico',
    'A M F F A',
    'America Servicios',
    'Jerarquicos Salud',
    'Ospib Roisa',
    'Imp Roisa',
    'Ospit Textiles Copago Roisa',
    'Avalian 16',
    'Osamoc Roisa',
    'Doctored 500 Roisa',
    'Doctored 505',
    'Doctored 1000',
    'Prevencion Salud Circulo',
    'Servicio Penitenciario Federal',
    'Accord Salud',
    'Pami',
    'Privamed 770',
    'Privamed 440',
    'Privamed 330',
    'Privamed 200',
    'Privamed 100',
    'Privamed 1000',
    'Colegio De Escribanos',
    'Federada Salud',
    'Osmiss Copago Roisa',
    'Ospep Roisa',
    'Doctored Premium Copago',
    'Clero',
    'Bienestar Salud Copago Roisa',
    'Ospfp Pintura Roisa',
    'Visitar Consulmed Copago',
    'Apres Consulmed',
    'Omint Consulmed',
    'Dosuba Consulmed',
    'Ensalud Consulmed',
    'Jardineros Consulmed',
    'Osalara Consulmed',
    'Osptv Sat Consulmed',
    'Sadaic Consulmed',
    'Ostel Telefonicos Consulmed',
    'Ospiqyp Quimica Y Petrolera Consulmed',
    'Asmepriv Consulmed',
    'Andar Consulmed',
    'Visitar Consulmed',
    'Osim Consulmed',
    'Osdop Consulmed',
    'Igualdad Salud Roisa',
    'Premedic',
    'Premedic 100',
    'Premedic 200',
    'Premedic 300',
    'Premedic 400 500',
    'Salud 360 Redsom',
    'Saber Salud Redsom Copago',
    'A Osblyca Cueros Y Anexos',
    'Privamed 880 Exento',
    'Privamed 880 Grav',
    'Medicus',
    'Medife',
    'Amffa Mutualistas Farmaceuticos'
];

async function insertObrasSociales() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida correctamente.');

        // Check existing count
        const [existingCount] = await sequelize.query('SELECT COUNT(*) as count FROM "ObrasSociales"');
        console.log(`📊 Obras sociales existentes: ${existingCount[0].count}`);

        // Insert obras sociales
        let inserted = 0;
        let skipped = 0;

        for (const nombre of obrasSociales) {
            try {
                // Check if it already exists
                const [existing] = await sequelize.query(
                    'SELECT id FROM "ObrasSociales" WHERE nombre = ?',
                    { replacements: [nombre] }
                );

                if (existing.length > 0) {
                    console.log(`⏭️  Obra social "${nombre}" ya existe, omitiendo...`);
                    skipped++;
                } else {
                    await sequelize.query(
                        'INSERT INTO "ObrasSociales" (nombre, "createdAt", "updatedAt") VALUES (?, NOW(), NOW())',
                        { replacements: [nombre] }
                    );
                    console.log(`✅ Insertada: ${nombre}`);
                    inserted++;
                }
            } catch (error) {
                console.error(`❌ Error al insertar "${nombre}":`, error.message);
            }
        }

        // Final count
        const [finalCount] = await sequelize.query('SELECT COUNT(*) as count FROM "ObrasSociales"');
        console.log(`\n📊 Resumen:`);
        console.log(`   - Obras sociales insertadas: ${inserted}`);
        console.log(`   - Obras sociales omitidas: ${skipped}`);
        console.log(`   - Total en la base de datos: ${finalCount[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
}

insertObrasSociales();
