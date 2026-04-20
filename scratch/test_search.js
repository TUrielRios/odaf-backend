const { Paciente, sequelize } = require('../src/models');
const { Op } = require('sequelize');

async function test() {
  const name = "AGUERO QUESUS BIANCA";
  console.log(`Searching for: "${name}"`);
  
  const p1 = await Paciente.findOne({ where: { nombre: { [Op.iLike]: name } } });
  console.log('Match nombre:', p1 ? p1.id : 'no');

  const p2 = await Paciente.findOne({ where: { apellido: { [Op.iLike]: name } } });
  console.log('Match apellido:', p2 ? p2.id : 'no');

  const all = await Paciente.findAll({ where: { [Op.or]: [{nombre: {[Op.iLike]: '%AGUERO%'}}, {apellido: {[Op.iLike]: '%AGUERO%'}}] } });
  console.log('Found with partial AGUERO:', all.length);
  if (all.length > 0) {
    console.log('First one:', all[0].nombre, '|', all[0].apellido);
  }
}

test().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
