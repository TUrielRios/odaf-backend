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

async function addPagoConfirmadoField() {
    try {
        await sequelize.authenticate();
        console.log('✓ Conectado a la base de datos');

        // Check if column already exists
        const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='turnos' AND column_name='pago_confirmado';
    `);

        if (results.length > 0) {
            console.log('⚠ El campo pago_confirmado ya existe en la tabla turnos');
            return;
        }

        // Add the column
        await sequelize.query(`
      ALTER TABLE turnos 
      ADD COLUMN pago_confirmado BOOLEAN DEFAULT false;
    `);

        console.log('✓ Campo pago_confirmado agregado exitosamente');

        // Update existing records to false
        await sequelize.query(`
      UPDATE turnos 
      SET pago_confirmado = false 
      WHERE pago_confirmado IS NULL;
    `);

        console.log('✓ Registros existentes actualizados');

    } catch (error) {
        console.error('✗ Error:', error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

addPagoConfirmadoField();
