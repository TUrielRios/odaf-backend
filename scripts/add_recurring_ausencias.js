const { sequelize } = require('../src/models');
const { QueryTypes } = require('sequelize');

async function migrate() {
  try {
    console.log('Starting migration to add recurring fields to ausencias...');
    
    // Check if columns exist first
    const tableInfo = await sequelize.getQueryInterface().describeTable('ausencias');
    
    if (!tableInfo.es_recurrente) {
      console.log('Adding es_recurrente column...');
      await sequelize.getQueryInterface().addColumn('ausencias', 'es_recurrente', {
        type: require('sequelize').DataTypes.BOOLEAN,
        defaultValue: false
      });
    }
    
    if (!tableInfo.dia_semana) {
      console.log('Adding dia_semana column...');
      await sequelize.getQueryInterface().addColumn('ausencias', 'dia_semana', {
        type: require('sequelize').DataTypes.INTEGER,
        allowNull: true
      });
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
