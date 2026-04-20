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

async function addFotoUrlColumn() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const queryInterface = sequelize.getQueryInterface();

        // Check if column exists first
        const tableDescription = await queryInterface.describeTable('profesionales');

        if (!tableDescription.foto_url) {
            await queryInterface.addColumn('profesionales', 'foto_url', {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'URL de la foto de perfil del profesional (Cloudinary)'
            });
            console.log('✅ Column "foto_url" added successfully to "profesionales" table.');
        } else {
            console.log('ℹ️ Column "foto_url" already exists in "profesionales" table.');
        }

    } catch (error) {
        console.error('❌ Error adding column:', error);
    } finally {
        await sequelize.close();
    }
}

addFotoUrlColumn();
