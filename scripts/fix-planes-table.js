require('dotenv').config({ path: __dirname + '/../.env' });
const { sequelize } = require('../src/models');

async function fixTable() {
  try {
    await sequelize.authenticate();
    console.log('Conectado a la base de datos.');

    console.log('Alterando tabla planes_tratamiento...');
    
    // Quitar NOT NULL de profesional_id
    await sequelize.query('ALTER TABLE "planes_tratamiento" ALTER COLUMN "profesional_id" DROP NOT NULL;');
    console.log('NOT NULL eliminado de profesional_id.');

    // Por las dudas, también de tratamientos si diera error después
    await sequelize.query('ALTER TABLE "planes_tratamiento" ALTER COLUMN "tratamientos" DROP NOT NULL;');
    console.log('NOT NULL eliminado de tratamientos.');

    // Y asegurar que las nuevas columnas existan
    await sequelize.sync({ alter: true });
    console.log('Sincronización final completada.');

    process.exit(0);
  } catch (error) {
    console.error('Error al arreglar la tabla:', error);
    process.exit(1);
  }
}

fixTable();
