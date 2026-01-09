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
        logging: console.log,
    }
);

async function fixPacienteIdNullable() {
    try {
        await sequelize.authenticate();
        console.log('Connection established successfully.');

        // Usar SQL directo para alterar la columna
        console.log('Making paciente_id nullable...');
        await sequelize.query(`
            ALTER TABLE movimientos_cuenta 
            ALTER COLUMN paciente_id DROP NOT NULL;
        `);
        console.log('✅ paciente_id is now nullable.');

    } catch (error) {
        console.error('❌ Error updating database:', error);
    } finally {
        await sequelize.close();
    }
}

fixPacienteIdNullable();
