const { Paciente } = require('../src/models');

async function test() {
  const count = await Paciente.count();
  console.log('Total patients in test script:', count);
  const some = await Paciente.findAll({ limit: 5 });
  some.forEach(p => console.log(`- ${p.nombre} | ${p.apellido}`));
}

test().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
