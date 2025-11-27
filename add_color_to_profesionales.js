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

async function addColorColumn() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const queryInterface = sequelize.getQueryInterface();

        // Check if column exists first
        const tableDescription = await queryInterface.describeTable('Profesionales');

        if (!tableDescription.color) {
            await queryInterface.addColumn('Profesionales', 'color', {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: '#026498' // Default blue color
            });
            console.log('✅ Column "color" added successfully to "Profesionales" table.');
        } else {
            console.log('ℹ️ Column "color" already exists in "Profesionales" table.');
        }

    } catch (error) {
        console.error('❌ Error adding column:', error);
    } finally {
        await sequelize.close();
    }
}

addColorColumn();
