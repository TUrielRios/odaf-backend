const { Paciente, Turno, Prestacion, sequelize } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

const SABRINA_PROFESIONAL_ID = 13;
const SERVICE_ID = 7; // Odontología general

const appointments = [
  // May 5
  { date: '2026-05-05', time: '09:00', patientName: 'Mia Nicole Acosta Pipet' },
  { date: '2026-05-05', time: '09:30', patientName: 'Benicio Eithan Sanchis' },
  { date: '2026-05-05', time: '10:00', patientName: 'Abel Benjamin Merlo' },
  { date: '2026-05-05', time: '10:30', patientName: 'Amy Abril Arzamendia' },
  { date: '2026-05-05', time: '10:30', patientName: 'Victoria Riveros', timeOverride: '10:31' },
  { date: '2026-05-05', time: '11:00', patientName: 'Victoria Agustina Bordon Actis Dell Anna' },
  { date: '2026-05-05', time: '11:00', patientName: 'Bruno Theo Vargas', timeOverride: '11:01' },
  { date: '2026-05-05', time: '11:30', patientName: 'Juan Carruega' },
  { date: '2026-05-05', time: '11:30', patientName: 'Isabella Garcia', timeOverride: '11:31' },
  { date: '2026-05-05', time: '12:00', patientName: 'Agustin Nahuel Ayala' },
  { date: '2026-05-05', time: '12:00', patientName: 'Emma Galan', timeOverride: '12:01' },
  { date: '2026-05-05', time: '12:30', patientName: 'Juan Manuel Servidio' },
  { date: '2026-05-05', time: '14:00', patientName: 'Bianca Acevedo Juma' },
  { date: '2026-05-05', time: '14:00', patientName: 'Thomas Acevedo', timeOverride: '14:01' },
  { date: '2026-05-05', time: '14:30', patientName: 'Ian Martin Acevedo' },
  { date: '2026-05-05', time: '14:30', patientName: 'Malena Juarez Nuñez', timeOverride: '14:31' },
  { date: '2026-05-05', time: '15:00', patientName: 'Valentino Benvenuto' },
  { date: '2026-05-05', time: '15:00', patientName: 'Juan Cruz Fernandez Alegre', timeOverride: '15:01' },
  { date: '2026-05-05', time: '15:30', patientName: 'Rosario Del Cielo Amarilla' },
  { date: '2026-05-05', time: '15:30', patientName: 'Santino Isidoro Amarilla', timeOverride: '15:31' },
  { date: '2026-05-05', time: '16:00', patientName: 'Bautista Leonardo Bernal Cerenzia' },
  { date: '2026-05-05', time: '16:00', patientName: 'Vida Cerenzia', timeOverride: '16:01' },
  { date: '2026-05-05', time: '16:30', patientName: 'Francesca Lujan Rota' },
  { date: '2026-05-05', time: '16:30', patientName: 'Giovanna Stefanizzi', timeOverride: '16:31' },
  { date: '2026-05-05', time: '17:00', patientName: 'Alexander Santos Mutte' },
  { date: '2026-05-05', time: '17:00', patientName: 'Bastian Santos Mutte', timeOverride: '17:01' },
  { date: '2026-05-05', time: '17:30', patientName: 'Maximiliano Bravo Medina' },
  { date: '2026-05-05', time: '18:00', patientName: 'Itan Medina' },
  { date: '2026-05-05', time: '19:00', patientName: 'Lola Vanina Otero' },

  // May 12
  { date: '2026-05-12', time: '09:00', patientName: 'Francesca Isabella Lansaque' },
  { date: '2026-05-12', time: '09:30', patientName: 'Nahuel Ezequiel Durand' },
  { date: '2026-05-12', time: '09:30', patientName: 'Ian Lionel Durand', timeOverride: '09:31' },
  { date: '2026-05-12', time: '10:00', patientName: 'Cristian Leandro Gonzalez' },
  { date: '2026-05-12', time: '10:00', patientName: 'Lion Jonathan Viera Padilla', timeOverride: '10:01' },
  { date: '2026-05-12', time: '10:30', patientName: 'Emily Yazmin Acosta' },
  { date: '2026-05-12', time: '10:30', patientName: 'Amaia Ludmila Zelaya', timeOverride: '10:31' },
  { date: '2026-05-12', time: '11:00', patientName: 'Guillermina Madeleine Rodriguez' },
  { date: '2026-05-12', time: '11:00', patientName: 'Owen Gael Rodriguez', timeOverride: '11:01' },
  { date: '2026-05-12', time: '11:30', patientName: 'Olivia Diaz' },
  { date: '2026-05-12', time: '12:00', patientName: 'Alahi Sofia Ledesma Avila' },
  { date: '2026-05-12', time: '12:30', patientName: 'Oliver Ignacio Popko' },
  { date: '2026-05-12', time: '14:00', patientName: 'Joaquin Nicolas Iacobellis' },
  { date: '2026-05-12', time: '14:30', patientName: 'Alma Jazmin Iacobellis' },
  { date: '2026-05-12', time: '15:00', patientName: 'Emma Francesca Torrez' },
  { date: '2026-05-12', time: '15:00', patientName: 'Gianna Fiorella Torrez', timeOverride: '15:01' },
  { date: '2026-05-12', time: '15:30', patientName: 'Fausto Bobadilla' },
  { date: '2026-05-12', time: '16:00', patientName: 'Clayton Becker Roa' },
  { date: '2026-05-12', time: '16:00', patientName: 'Lara Chanel Roa', timeOverride: '16:01' },
  { date: '2026-05-12', time: '16:30', patientName: 'Benjamin Ian Castro' },
  { date: '2026-05-12', time: '16:30', patientName: 'Santino Javier Lopez', timeOverride: '16:31' },
  { date: '2026-05-12', time: '17:00', patientName: 'Isabella Agostina Lopez' },
  { date: '2026-05-12', time: '17:00', patientName: 'Valentina Jazmin Lopez', timeOverride: '17:01' },
  { date: '2026-05-12', time: '17:30', patientName: 'Clara Guillermina Martinez Pailos' },
  { date: '2026-05-12', time: '17:30', patientName: 'Maria Yasmin Pailos Fuentes', timeOverride: '17:31' },

  // May 19
  { date: '2026-05-19', time: '09:00', patientName: 'Isabella Maite Zalazar Acuña' },
  { date: '2026-05-19', time: '10:00', patientName: 'Luna Abigail Cardozo' },
  { date: '2026-05-19', time: '10:30', patientName: 'Bautista Gael Arce' },
  { date: '2026-05-19', time: '11:00', patientName: 'Hilen Arami Santos' },
  { date: '2026-05-19', time: '11:30', patientName: 'Inti Uriel Santos' },
  { date: '2026-05-19', time: '12:00', patientName: 'Martina Avril Sanchez' },
  { date: '2026-05-19', time: '12:00', patientName: 'Vitto Galeno Zavala Cipriano', timeOverride: '12:01' },
  { date: '2026-05-19', time: '12:30', patientName: 'Maite Miranda' },
  { date: '2026-05-19', time: '14:00', patientName: 'Emmanuel Simon Mlodziejewski' },
  { date: '2026-05-19', time: '14:30', patientName: 'Benicio Giovanni Pastor Furfaro' },
  { date: '2026-05-19', time: '15:00', patientName: 'Noel Valentin Andrada Benitez' },
  { date: '2026-05-19', time: '15:30', patientName: 'Tadeo Lautaro Andrada Benitez' },
  { date: '2026-05-19', time: '16:00', patientName: 'Astrid Janet Ruibal' },
  { date: '2026-05-19', time: '16:30', patientName: 'PACIENTE CONTROL 9' },
  { date: '2026-05-19', time: '16:30', patientName: 'Tiago Gabriel Pereira', timeOverride: '16:31' },
  { date: '2026-05-19', time: '17:00', patientName: 'Melody Buonanno' },
  { date: '2026-05-19', time: '17:00', patientName: 'Bruno Maximo Peralta', timeOverride: '17:01' },
  { date: '2026-05-19', time: '17:30', patientName: 'Alma Milagros Castro' },
  { date: '2026-05-19', time: '18:00', patientName: 'Isabella Magali Barrientos' },

  // May 26
  { date: '2026-05-26', time: '09:30', patientName: 'Noha Liam Torres Lugo' },
  { date: '2026-05-26', time: '15:00', patientName: 'Zoe Aitana Andrada Benitez' },
  { date: '2026-05-26', time: '15:30', patientName: 'Jazmin Sophie Olguin Salazar' },
  { date: '2026-05-26', time: '16:00', patientName: 'Valerio Octavio Olguin Salazar' },
  { date: '2026-05-26', time: '17:00', patientName: 'Leon Danilo Lencina' },
  { date: '2026-05-26', time: '17:00', patientName: 'Mora Ailen Lencina', timeOverride: '17:01' },
  { date: '2026-05-26', time: '17:30', patientName: 'Ignacio Aguilar Kramer' },
];

function add30Minutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes + 30;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

async function run() {
  console.log('Starting migration for Sabrina...');
  
  for (const app of appointments) {
    try {
      const names = app.patientName.split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || 'Falta Apellido';
      
      // Find or create patient
      let patient = await Paciente.findOne({
        where: {
          nombre: firstName,
          apellido: lastName
        }
      });
      
      if (!patient) {
        console.log(`Creating patient: ${app.patientName}`);
        patient = await Paciente.create({
          id: uuidv4(),
          nombre: firstName,
          apellido: lastName,
          tipo_documento: 'DNI',
          numero_documento: 'MIG-' + Math.floor(Math.random() * 1000000000),
          fecha_nacimiento: '1990-01-01',
          sexo: 'Otro',
          condicion: 'Activo'
        });
      }
      
      const startTime = app.timeOverride || app.time;
      const endTime = add30Minutes(startTime);

      // Check if turno already exists
      let turno = await Turno.findOne({
        where: {
          paciente_id: patient.id,
          profesional_id: SABRINA_PROFESIONAL_ID,
          fecha: app.date,
          hora_inicio: startTime
        }
      });

      if (!turno) {
        // Create Turno
        turno = await Turno.create({
          paciente_id: patient.id,
          profesional_id: SABRINA_PROFESIONAL_ID,
          servicio_id: SERVICE_ID,
          fecha: app.date,
          hora_inicio: startTime,
          hora_fin: endTime,
          estado: 'Confirmado'
        });
      }
      
      // Check if prestacion exists
      const existingPrestacion = await Prestacion.findOne({
        where: {
          turno_id: turno.id
        }
      });

      if (!existingPrestacion) {
        // Create Prestacion
        await Prestacion.create({
          turno_id: turno.id,
          profesional_id: SABRINA_PROFESIONAL_ID,
          paciente_id: patient.id,
          servicio_id: SERVICE_ID,
          fecha: app.date,
          monto_total: 0,
          monto_profesional: 0,
          estado: 'Pendiente'
        });
      }
      
      console.log(`Added/Verified appointment for ${app.patientName} at ${app.date} ${startTime}`);
    } catch (error) {
      console.error(`Error processing appointment for ${app.patientName}:`, error.message);
    }
  }
  
  console.log('Migration for Sabrina finished!');
  process.exit(0);
}

run();
