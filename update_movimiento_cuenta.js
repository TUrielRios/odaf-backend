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

async function updateMovimientoCuenta() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const queryInterface = sequelize.getQueryInterface();

        // 1. Make paciente_id nullable
        console.log('Modifying paciente_id to allow null...');
        await queryInterface.changeColumn('movimientos_cuenta', 'paciente_id', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'pacientes',
                key: 'id'
            }
        });
        console.log('✅ paciente_id is now nullable.');

        // 2. Add 'Egreso' to enum
        // Note: Sequelize doesn't support ALTER TYPE natively for Postgres in changeColumn easily, 
        // so we use raw SQL.
        console.log('Adding "Egreso" to enum_movimientos_cuenta_tipo...');
        try {
            await sequelize.query(`ALTER TYPE "enum_movimientos_cuenta_tipo" ADD VALUE 'Egreso';`);
            console.log('✅ "Egreso" added to enum.');
        } catch (e) {
            if (e.original && e.original.code === '42710') {
                console.log('ℹ️ "Egreso" already exists in enum.');
            } else {
                throw e;
            }
        }

    } catch (error) {
        console.error('❌ Error updating database:', error);
    } finally {
        await sequelize.close();
    }
}

updateMovimientoCuenta();
