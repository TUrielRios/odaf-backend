
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
});

async function test() {
    try {
        console.log(`Testing connection to ${process.env.DB_HOST}:${process.env.DB_PORT}...`);
        await sequelize.authenticate();
        console.log('✅ Railway DB: Connection Successful!');
    } catch (error) {
        console.error('❌ Railway DB: Connection Failed');
        console.error('Error:', error.message);
    }
}

test();
