const { Paciente, Turno, sequelize } = require('../src/models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'appointments_data.json'), 'utf8'));

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

let nextDni = 99000001;

async function findPatient(name) {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  const words = cleanName.split(' ').filter(w => w.length > 2);

  // 1. Exact match
  let patient = await Paciente.findOne({
    where: {
      [Op.or]: [
        { nombre: { [Op.iLike]: cleanName } },
        { apellido: { [Op.iLike]: cleanName } }
      ]
    }
  });

  // 2. Concatenated
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

  // 3. Word match
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

async function createPatient(name) {
  // Simple split: first word as name, rest as surname
  const parts = name.trim().split(' ');
  const nombre = parts[0];
  const apellido = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];

  const dni = String(nextDni++);

  return await Paciente.create({
    nombre: nombre || "PENDIENTE",
    apellido: apellido || "PENDIENTE",
    tipo_documento: "DNI",
    numero_documento: dni,
    fecha_nacimiento: "2000-01-01",
    sexo: "Otro",
    condicion: "Activo"
  });
}

async function run() {
  const stats = { created: 0, matched: 0, patientsCreated: 0 };

  for (const profKey of ['adriana', 'florencia']) {
    const profConfig = config[profKey];
    const appointments = data[profKey];

    console.log(`\nMigrating ${profKey}...`);

    for (const appt of appointments) {
      try {
        let patient = await findPatient(appt.patientName);
        if (!patient) {
          patient = await createPatient(appt.patientName);
          console.log(`Created patient: ${appt.patientName} (DNI: ${patient.numero_documento})`);
          stats.patientsCreated++;
        } else {
          stats.matched++;
        }

        // Calculate times
        const [h, m] = appt.time.split(':').map(Number);
        const startDate = new Date(2000, 0, 1, h, m);
        const endDate = new Date(startDate.getTime() + profConfig.duration * 60000);
        const hora_fin = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;

        await Turno.create({
          paciente_id: patient.id,
          profesional_id: profConfig.profesional_id,
          servicio_id: profConfig.servicio_id,
          fecha: appt.date,
          hora_inicio: appt.time + ':00',
          hora_fin: hora_fin,
          estado: 'Pendiente',
          notas: `Migrado de sistema anterior. Paciente original: ${appt.patientName}`
        });

        stats.created++;
      } catch (err) {
        console.error(`Error with ${appt.patientName}:`, err.message);
      }
    }
  }

  console.log('\n--- MIGRATION COMPLETE ---');
  console.log(`Turnos created: ${stats.created}`);
  console.log(`Patients reused: ${stats.matched}`);
  console.log(`New patients created: ${stats.patientsCreated}`);
}

run().then(() => {
  console.log('Success.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
