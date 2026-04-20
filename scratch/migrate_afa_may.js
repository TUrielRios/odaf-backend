const { Turno, Paciente, Prestacion, Profesional, Servicio, SubServicio, ProfesionalServicio } = require('../src/models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

const appointments = JSON.parse(fs.readFileSync(path.join(__dirname, 'afa_may_appointments.json'), 'utf8'));

const PROFESSIONAL_ID = 18;
const SERVICE_ID = 2;
const STATUS = 'Confirmado';

async function findOrCreatePatient(fullName) {
  const normalizedSearch = fullName.trim().toLowerCase();
  
  // 1. Exact match
  let patient = await Paciente.findOne({
    where: {
      [Op.where]: require('sequelize').where(
        require('sequelize').fn('concat', require('sequelize').col('nombre'), ' ', require('sequelize').col('apellido')),
        { [Op.iLike]: normalizedSearch }
      )
    }
  });

  if (patient) return patient;

  // 2. Keyword match
  const words = normalizedSearch.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 0) {
    const wordMatches = await Paciente.findAll({
      where: {
        [Op.or]: words.map(word => ({
          [Op.or]: [
            { nombre: { [Op.iLike]: `%${word}%` } },
            { apellido: { [Op.iLike]: `%${word}%` } }
          ]
        }))
      }
    });

    if (wordMatches.length === 1) return wordMatches[0];
  }

  // 3. Create if not found
  console.log(`Creating patient: ${fullName}`);
  const [nombre, ...apellidoParts] = fullName.split(' ');
  const apellido = apellidoParts.join(' ') || 'MIGRADO';
  
  // Generate a unique DNI placeholder (99101xxx) - Offset from April to avoid rare overlap
  const count = await Paciente.count({ where: { numero_documento: { [Op.like]: '99101%' } } });
  const dni = (99101000 + count + 1).toString();

  return await Paciente.create({
    nombre,
    apellido,
    numero_documento: dni,
    tipo_documento: 'DNI',
    fecha_nacimiento: '2000-01-01',
    sexo: 'Otro',
    estado: 'Inactivo'
  });
}

async function createPrestacion(turno) {
  const profesional = await Profesional.findByPk(turno.profesional_id);
  const servicio = await Servicio.findByPk(turno.servicio_id);
  
  const montoTotal = servicio.precio_base || 0;
  const porcentaje = profesional.porcentaje_comision || 50;

  await Prestacion.create({
    turno_id: turno.id,
    profesional_id: turno.profesional_id,
    paciente_id: turno.paciente_id,
    servicio_id: turno.servicio_id,
    fecha: turno.fecha,
    monto_total: montoTotal,
    porcentaje_profesional: porcentaje,
    monto_profesional: (montoTotal * porcentaje) / 100,
    estado: 'Pendiente'
  });
}

async function run() {
  let createdCount = 0;
  
  for (const [date, slots] of Object.entries(appointments)) {
    console.log(`Processing date: ${date}`);
    for (const slot of slots) {
      try {
        const patient = await findOrCreatePatient(slot.patientName);
        
        // Calculate end time
        const [h, m] = slot.time.split(':');
        let eh = parseInt(h);
        let em = parseInt(m) + 30;
        if (em >= 60) {
          eh += 1;
          em -= 60;
        }
        const endTime = `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`;

        const turno = await Turno.create({
          paciente_id: patient.id,
          profesional_id: PROFESSIONAL_ID,
          servicio_id: SERVICE_ID,
          fecha: date,
          hora_inicio: slot.time,
          hora_fin: endTime,
          estado: STATUS,
          notas: `Migrado de sistema anterior (AFA Mayo). Paciente original: ${slot.patientName}`,
          sobre_turno: true
        });

        await createPrestacion(turno);
        createdCount++;
      } catch (err) {
        console.error(`Error creating turno for ${slot.patientName} at ${slot.time}:`, err.message);
      }
    }
  }
  
  console.log(`Migration completed. Created ${createdCount} turnos.`);
  process.exit();
}

run();
