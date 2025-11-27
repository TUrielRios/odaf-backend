const { Sequelize } = require('sequelize');
const { Profesional } = require('./src/models');
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

async function testScheduleSaving() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');

        // 1. Create a dummy professional
        const prof = await Profesional.create({
            nombre: 'Test',
            apellido: 'Schedule',
            numero_documento: 'TEST1234',
            numero_matricula: 'TESTMAT1',
            especialidad: 'Testing',
            email: 'test@schedule.com',
            estado: 'Activo',
            horarios_atencion: {}
        });
        console.log('Professional created with ID:', prof.id);

        // 2. Define schedules
        const schedules = {
            lunes: { activo: true, rangos: [{ inicio: "09:00", fin: "12:00" }, { inicio: "14:00", fin: "18:00" }] },
            martes: { activo: false, rangos: [{ inicio: "09:00", fin: "17:00" }] },
            miercoles: { activo: true, rangos: [{ inicio: "10:00", fin: "16:00" }] },
            jueves: { activo: false, rangos: [] },
            viernes: { activo: false, rangos: [] },
            sabado: { activo: false, rangos: [] },
            domingo: { activo: false, rangos: [] }
        };

        // 3. Update schedules (simulate controller logic)
        // The controller validates and then updates. We'll just update directly to see if it persists correctly.
        await Profesional.update({ horarios_atencion: schedules }, { where: { id: prof.id } });
        console.log('Schedules updated');

        // 4. Retrieve schedules
        const updatedProf = await Profesional.findByPk(prof.id);
        const retrievedSchedules = updatedProf.horarios_atencion;

        console.log('Retrieved Schedules:', JSON.stringify(retrievedSchedules, null, 2));

        // 5. Verify
        if (retrievedSchedules.lunes.rangos.length === 2 && retrievedSchedules.lunes.rangos[1].fin === "18:00") {
            console.log('✅ Lunes schedules match');
        } else {
            console.error('❌ Lunes schedules DO NOT match');
        }

        // Cleanup
        await Profesional.destroy({ where: { id: prof.id } });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

testScheduleSaving();
