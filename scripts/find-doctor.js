require('dotenv').config({ path: __dirname + '/../.env' });
const { Profesional } = require('../src/models');
const { Op } = require('sequelize');

async function findDoctor() {
  try {
    const doctors = await Profesional.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.iLike]: '%Garofolo%' } },
          { apellido: { [Op.iLike]: '%Garofolo%' } }
        ]
      }
    });
    console.log('Results for Garofolo:', doctors.map(d => ({ id: d.id, nombre: d.nombre, apellido: d.apellido })));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findDoctor();
