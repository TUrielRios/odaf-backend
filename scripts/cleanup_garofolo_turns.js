const { Turno, Prestacion, sequelize } = require('../src/models');
const { Op } = require('sequelize');

async function run() {
  console.log('Cleaning up misassigned turns for professional ID 7 (Garofolo) created today...');
  
  const today = new Date('2026-04-27T00:00:00Z');
  
  try {
    const turnsToDelete = await Turno.findAll({
      where: {
        profesional_id: 7,
        createdAt: {
          [Op.gt]: today
        }
      }
    });
    
    console.log(`Found ${turnsToDelete.length} turns to delete.`);
    
    for (const turno of turnsToDelete) {
      // Delete associated prestations first
      await Prestacion.destroy({
        where: {
          turno_id: turno.id
        }
      });
      
      // Delete the turno
      await turno.destroy();
      console.log(`Deleted turn ID ${turno.id} for date ${turno.fecha}`);
    }
    
    console.log('Cleanup finished!');
  } catch (error) {
    console.error('Error during cleanup:', error.message);
  }
  
  process.exit(0);
}

run();
