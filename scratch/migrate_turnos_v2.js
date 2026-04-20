const { Paciente, Turno, Profesional, Servicio, sequelize } = require('../src/models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'appointments_data.json'), 'utf8'));

// Configuration
const config = {
  adriana: {
    profesional_id: 1,
    servicio_id: 4, // Ortopedia
    duration: 20
  },
  florencia: {
    profesional_id: 7,
    servicio_id: 2, // Odontopediatria
    duration: 30
  }
};

async function findPatient(name) {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  const words = cleanName.split(' ').filter(w => w.length > 2);

  // 1. Try exact match on name or surname
  let patient = await Paciente.findOne({
    where: {
      [Op.or]: [
        { nombre: { [Op.iLike]: cleanName } },
        { apellido: { [Op.iLike]: cleanName } }
      ]
    }
  });

  // 2. Try match on concatenated fields
  if (!patient) {
    patient = await Paciente.findOne({
      where: {
        [Op.or]: [
          sequelize.where(
            sequelize.fn('concat', sequelize.col('nombre'), ' ', sequelize.col('apellido')),
            { [Op.iLike]: `%${cleanName}%` }
          ),
          sequelize.where(
            sequelize.fn('concat', sequelize.col('apellido'), ' ', sequelize.col('nombre')),
            { [Op.iLike]: `%${cleanName}%` }
          )
        ]
      }
    });
  }

  // 3. Try word match (all words must be present in either field)
  if (!patient && words.length > 0) {
    patient = await Paciente.findOne({
      where: {
        [Op.and]: words.map(w => ({
          [Op.or]: [
            { nombre: { [Op.iLike]: `%${w}%` } },
            { apellido: { [Op.iLike]: `%${w}%` } }
          ]
        }))
      }
    });
  }

  return patient;
}

async function dryRun() {
  const results = {
    foundCount: 0,
    missing: [],
  };

  const toCreate = [];

  for (const profKey of ['adriana', 'florencia']) {
    const profConfig = config[profKey];
    const appointments = data[profKey];

    console.log(`\nProcessing ${profKey}...`);

    for (const appt of appointments) {
      try {
        const patient = await findPatient(appt.patientName);
        if (patient) {
          // Calculate hora_fin
          const [h, m] = appt.time.split(':').map(Number);
          const startDate = new Date(2000, 0, 1, h, m);
          const endDate = new Date(startDate.getTime() + profConfig.duration * 60000);
          const hora_fin = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;

          toCreate.push({
            paciente_id: patient.id,
            profesional_id: profConfig.profesional_id,
            servicio_id: profConfig.servicio_id,
            fecha: appt.date,
            hora_inicio: appt.time + ':00',
            hora_fin: hora_fin,
            estado: 'Pendiente',
            patientName: appt.patientName,
            foundAs: `${patient.nombre} ${patient.apellido}`
          });
          results.foundCount++;
        } else {
          results.missing.push(appt);
        }
      } catch (err) {
        console.error(`Error processing ${appt.patientName}:`, err.message);
      }
    }
  }

  console.log('\n--- DRY RUN SUMMARY ---');
  console.log(`Found: ${results.foundCount}`);
  console.log(`Missing: ${results.missing.length}`);
  
  if (results.missing.length > 0) {
    console.log('\nMissing Patients SAMPLE (first 10):');
    results.missing.slice(0, 10).forEach(m => console.log(`- ${m.patientName} (${m.date} ${m.time})`));
  }

  fs.writeFileSync(path.join(__dirname, 'migration_payload.json'), JSON.stringify(toCreate, null, 2));
  console.log('\nPayload saved to migration_payload.json');
}

dryRun().then(() => {
  console.log('Dry run complete.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
