const { Paciente } = require('../src/models');
const { Op } = require('sequelize');

async function checkPaciente() {
  try {
    const search = 'MAXIMO';
    const patients = await Paciente.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.iLike]: `%${search}%` } },
          { apellido: { [Op.iLike]: `%${search}%` } }
        ]
      }
    });
    console.log('Results for ' + search + ':', patients.map(p => ({ id: p.id, nombre: p.nombre, apellido: p.apellido })));
  } catch (e) {
    console.error(e);
  }
  process.exit();
}

checkPaciente();
