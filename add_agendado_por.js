const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;
if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: console.log,
    });
} else {
    sequelize = new Sequelize(
        process.env.DB_NAME || "dental_clinic_dev",
        process.env.DB_USER || "postgres",
        process.env.DB_PASSWORD || "password",
        {
            host: process.env.DB_HOST || "localhost",
            port: process.env.DB_PORT || 5432,
            dialect: 'postgres',
            logging: console.log,
        }
    );
}

async function addAgendadoPorField() {
    try {
        await sequelize.authenticate();
        console.log('✓ Conectado a la base de datos');

        // Check if column already exists
        const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='turnos' AND column_name='agendado_por';
    `);

        if (results.length > 0) {
            console.log('⚠ El campo agendado_por ya existe en la tabla turnos');
            return;
        }

        // Add the column
        await sequelize.query(`
      ALTER TABLE turnos 
      ADD COLUMN agendado_por VARCHAR(255);
    `);

        console.log('✓ Campo agendado_por agregado exitosamente');

    } catch (error) {
        console.error('✗ Error:', error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

addAgendadoPorField();
