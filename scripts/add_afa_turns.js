const { Paciente, Turno, Prestacion, sequelize } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

const AFA_PROFESIONAL_ID = 18;
const SERVICE_ID = 7; // Odontología general

const appointments = [
  // April 29
  { date: '2026-04-29', time: '10:00', patientName: 'Benjamin Santarcangelo' },
  { date: '2026-04-29', time: '10:30', patientName: 'Erica Santarcangelo' },
  { date: '2026-04-29', time: '11:30', patientName: 'Valentina Pellegrini' },
  { date: '2026-04-29', time: '14:00', patientName: 'Thiago Benjamin Pereyra' },
  { date: '2026-04-29', time: '14:30', patientName: 'Alma Lizeth Aguirre' },
  { date: '2026-04-29', time: '15:00', patientName: 'Thiago Roman Godoy' },
  { date: '2026-04-29', time: '15:30', patientName: 'Leon Martin Verderame Facundo' },
  { date: '2026-04-29', time: '16:30', patientName: 'Jimena Natalia Bagala' },
  { date: '2026-04-29', time: '17:00', patientName: 'Benjamin Matteo Piazza Bagala' },
  { date: '2026-04-29', time: '17:30', patientName: 'Umma Daniela Benitez Di Ponte' },

  // April 30
  { date: '2026-04-30', time: '09:00', patientName: 'PACIENTE CONTROL 2' },
  { date: '2026-04-30', time: '10:30', patientName: 'Brunela Canteros' },
  { date: '2026-04-30', time: '11:30', patientName: 'Alice Jane Salazar Arends' },
  { date: '2026-04-30', time: '11:30', patientName: 'Hally Mackenzie Salazar Arends', timeOverride: '11:31' },
  { date: '2026-04-30', time: '12:30', patientName: 'Benjamin Buscarioli' },
  { date: '2026-04-30', time: '14:30', patientName: 'Guadalupe More Del Valle' },
  { date: '2026-04-30', time: '15:30', patientName: 'Angie Johanna Torres' },
  { date: '2026-04-30', time: '16:30', patientName: 'Valentina Ale' },
  { date: '2026-04-30', time: '17:00', patientName: 'Renata Esperje' },
  { date: '2026-04-30', time: '17:30', patientName: 'Catalina Tolosa' },

  // May 1
  { date: '2026-05-01', time: '10:00', patientName: 'Mia Canteros' },
  { date: '2026-05-01', time: '11:30', patientName: 'Juana Evangeli' },
  { date: '2026-05-01', time: '11:30', patientName: 'Janno Stefano Vallejos', timeOverride: '11:31' },
  { date: '2026-05-01', time: '12:00', patientName: 'Juan Ignacio Blanco Carbone' },
  { date: '2026-05-01', time: '12:30', patientName: 'Agustin Vallejos' },
  { date: '2026-05-01', time: '14:00', patientName: 'Francesca Blanco Carbone' },
  { date: '2026-05-01', time: '14:30', patientName: 'Bruno Chias' },
  { date: '2026-05-01', time: '15:30', patientName: 'Ramiro Nicolas Frei' },
  { date: '2026-05-01', time: '16:30', patientName: 'Kiara Denise Rojas Ojeda' },
  { date: '2026-05-01', time: '17:00', patientName: 'Dante Samuel Ledesma Adami' },

  // May 2
  { date: '2026-05-02', time: '10:00', patientName: 'Martina Quimey Rojas Ojeda' },
  { date: '2026-05-02', time: '10:30', patientName: 'Jacqueline Adriana Rodriguez Techera' },
  { date: '2026-05-02', time: '11:30', patientName: 'PACIENTE CONTROL 1' },

  // May 13
  { date: '2026-05-13', time: '09:00', patientName: 'Ambar Fernanda Cervin' },
  { date: '2026-05-13', time: '09:00', patientName: 'Mateo Javier Cervin', timeOverride: '09:01' },
  { date: '2026-05-13', time: '09:30', patientName: 'Ariadna Lujan Cardenes' },
  { date: '2026-05-13', time: '09:30', patientName: 'Laura Noelia Martinez', timeOverride: '09:31' },
  { date: '2026-05-13', time: '10:00', patientName: 'Morena Ariane Ocampo' },
  { date: '2026-05-13', time: '10:01', patientName: 'Thiago Benjamin Pereyra' },
  { date: '2026-05-13', time: '10:30', patientName: 'Maria Solange Encina' },
  { date: '2026-05-13', time: '11:00', patientName: 'Eluney Abigail Pelosi' },
  { date: '2026-05-13', time: '11:01', patientName: 'Olivia Traverso' },
  { date: '2026-05-13', time: '11:30', patientName: 'Maka De La Granja' },
  { date: '2026-05-13', time: '11:31', patientName: 'Mia De La Granja' },
  { date: '2026-05-13', time: '12:00', patientName: 'Lourdes Mia Arce' },
  { date: '2026-05-13', time: '12:30', patientName: 'Milagros Zoe Arce' },
  { date: '2026-05-13', time: '14:00', patientName: 'Milagros Aylen Suarez' },
  { date: '2026-05-13', time: '14:01', patientName: 'Natasha Suarez' },
  { date: '2026-05-13', time: '14:30', patientName: 'Antonella Barconte' },
  { date: '2026-05-13', time: '14:31', patientName: 'Sofia Ana Bella Suarez' },
  { date: '2026-05-13', time: '15:00', patientName: 'Ian Leonel Lescano Sosa' },
  { date: '2026-05-13', time: '15:30', patientName: 'PACIENTE CONTROL 3' },

  // May 14
  { date: '2026-05-14', time: '09:00', patientName: 'Pablo Martin Lopez' },
  { date: '2026-05-14', time: '10:00', patientName: 'Alvaro Berreta' },
  { date: '2026-05-14', time: '10:01', patientName: 'Alai Jazmin Gonzalez' },
  { date: '2026-05-14', time: '10:30', patientName: 'Thiago Roman Godoy' },
  { date: '2026-05-14', time: '11:00', patientName: 'Leon Martin Verderame Facundo' },
  { date: '2026-05-14', time: '11:30', patientName: 'Oriana Ayala Garcia' },
  { date: '2026-05-14', time: '11:31', patientName: 'Matias Nicolas Ruhl' },
  { date: '2026-05-14', time: '12:00', patientName: 'Jimena Natalia Bagala' },
  { date: '2026-05-14', time: '12:01', patientName: 'Valentina Pilar Ruhl' },
  { date: '2026-05-14', time: '12:30', patientName: 'Benjamin Matteo Piazza Bagala' },
  { date: '2026-05-14', time: '14:00', patientName: 'Umma Daniela Benitez Di Ponte' },
  { date: '2026-05-14', time: '14:01', patientName: 'Mora Vangeli' },
  { date: '2026-05-14', time: '14:30', patientName: 'Brunela Canteros' },
  { date: '2026-05-14', time: '14:31', patientName: 'Bautista Coloni' },
  { date: '2026-05-14', time: '15:00', patientName: 'Alice Jane Salazar Arends' },
  { date: '2026-05-14', time: '15:01', patientName: 'Hally Mackenzie Salazar Arends' },
  { date: '2026-05-14', time: '15:30', patientName: 'Benjamin Buscarioli' },
  { date: '2026-05-14', time: '16:00', patientName: 'Guadalupe More Del Valle' },
  { date: '2026-05-14', time: '16:01', patientName: 'Angie Johanna Torres' },
  { date: '2026-05-14', time: '16:30', patientName: 'Valentina Ale' },
  { date: '2026-05-14', time: '16:31', patientName: 'Renata Esperje' },
  { date: '2026-05-14', time: '17:00', patientName: 'Catalina Tolosa' },
  { date: '2026-05-14', time: '17:30', patientName: 'Emanuel Benicio Silva' },
  { date: '2026-05-14', time: '17:31', patientName: 'Daniel Guillermo Silva' },

  // May 15
  { date: '2026-05-15', time: '09:00', patientName: 'PACIENTE CONTROL 4' },
  { date: '2026-05-15', time: '10:00', patientName: 'Mia Canteros' },
  { date: '2026-05-15', time: '10:01', patientName: 'Juana Evangeli' },
  { date: '2026-05-15', time: '10:30', patientName: 'Benjamin Joel Calengo' },
  { date: '2026-05-15', time: '11:00', patientName: 'Isabella Jazmin Carrizo Mena' },
  { date: '2026-05-15', time: '11:01', patientName: 'Valentino Monsalve Garcia' },
  { date: '2026-05-15', time: '11:30', patientName: 'Janno Stefano Vallejos' },
  { date: '2026-05-15', time: '12:00', patientName: 'Juan Ignacio Blanco Carbone' },
  { date: '2026-05-15', time: '12:01', patientName: 'Agustin Vallejos' },
  { date: '2026-05-15', time: '12:30', patientName: 'Francesca Blanco Carbone' },
  { date: '2026-05-15', time: '14:00', patientName: 'Bruno Chias' },
  { date: '2026-05-15', time: '14:30', patientName: 'Ramiro Nicolas Frei' },
  { date: '2026-05-15', time: '15:00', patientName: 'Kiara Denise Rojas Ojeda' },
  { date: '2026-05-15', time: '15:30', patientName: 'Dante Samuel Ledesma Adami' },
  { date: '2026-05-15', time: '15:31', patientName: 'Martina Quimey Rojas Ojeda' },
  { date: '2026-05-15', time: '16:00', patientName: 'Jacqueline Adriana Rodriguez Techera' },
  { date: '2026-05-15', time: '16:30', patientName: 'PACIENTE CONTROL 5' },

  // May 20
  { date: '2026-05-20', time: '09:00', patientName: 'Mirta Lorena Kopach' },
  { date: '2026-05-20', time: '09:30', patientName: 'Ambar Lizeth Aguirre' },
  { date: '2026-05-20', time: '10:00', patientName: 'Ambar Isabella Coronel' },
  { date: '2026-05-20', time: '10:01', patientName: 'Bianca Rogowski' },
  { date: '2026-05-20', time: '10:30', patientName: 'Baltazar Rojas' },
  { date: '2026-05-20', time: '11:00', patientName: 'Julian Elias Gioia Caffaratti' },
  { date: '2026-05-20', time: '11:30', patientName: 'Felipe Sanchez' },
  { date: '2026-05-20', time: '11:31', patientName: 'Ariel Lorenzo Scarpitto' },
  { date: '2026-05-20', time: '12:00', patientName: 'Luz Belen Scarpitto' },
  { date: '2026-05-20', time: '14:00', patientName: 'Valentino Ian Acevedo' },
  { date: '2026-05-20', time: '14:30', patientName: 'Tomas Federico Brito' },
  { date: '2026-05-20', time: '14:31', patientName: 'Emanuel Escobar' },
  { date: '2026-05-20', time: '15:00', patientName: 'Bautista Leon Morel' },
  { date: '2026-05-20', time: '15:30', patientName: 'PACIENTE CONTROL 6' },

  // May 21
  { date: '2026-05-21', time: '09:00', patientName: 'PACIENTE CONTROL 7' },
  { date: '2026-05-21', time: '10:00', patientName: 'Lucio Minichiello' },
  { date: '2026-05-21', time: '11:30', patientName: 'Liam Misael Saravia' },
  { date: '2026-05-21', time: '14:00', patientName: 'Dayla Elizabeth Figueroa' },
  { date: '2026-05-21', time: '14:30', patientName: 'Ludmila Belen Rojas' },
  { date: '2026-05-21', time: '15:00', patientName: 'Mateo Vittorio Beltran' },
  { date: '2026-05-21', time: '15:01', patientName: 'Olivia Francesca Vargas' },
  { date: '2026-05-21', time: '15:30', patientName: 'Lara Guadalupe Beltran' },
  { date: '2026-05-21', time: '15:31', patientName: 'Luca Leon Vargas' },
  { date: '2026-05-21', time: '16:00', patientName: 'Simon Maistruarena' },
  { date: '2026-05-21', time: '16:30', patientName: 'Carolina Nuñez' },
  { date: '2026-05-21', time: '17:00', patientName: 'Lisandro Gomez' },
  { date: '2026-05-21', time: '17:01', patientName: 'Valentin Gomez' },
  { date: '2026-05-21', time: '17:30', patientName: 'Teo Limburger' },

  // May 22
  { date: '2026-05-22', time: '09:00', patientName: 'PACIENTE CONTROL 8' },
  { date: '2026-05-22', time: '10:00', patientName: 'Milo Benjamin Rodriguez' },
  { date: '2026-05-22', time: '10:30', patientName: 'Mia Thais Colman' },
  { date: '2026-05-22', time: '11:30', patientName: 'Joaquin Dominguez' },
  { date: '2026-05-22', time: '14:00', patientName: 'Ramiro Joaquin Romero' },
  { date: '2026-05-22', time: '14:30', patientName: 'Emma Victoria Benitez Gonzalez' },
  { date: '2026-05-22', time: '14:31', patientName: 'Briana Daylin Castillo Benitez' },
  { date: '2026-05-22', time: '15:00', patientName: 'Simon Onecimo Ojeda Segovia' },
  { date: '2026-05-22', time: '15:30', patientName: 'Bautista Regueiro' },
  { date: '2026-05-22', time: '16:30', patientName: 'Benjamin Muiños' },
  { date: '2026-05-22', time: '17:00', patientName: 'Ignacio Moriano' },
];

function add30Minutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes + 30;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

async function run() {
  console.log('Starting COMPLETE migration for Arce (ID 18)...');
  
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

      // Create Turno (assuming check was already done or wanting to re-add precisely)
      // Actually we'll keep the findOne for safety if running multiple times
      let turno = await Turno.findOne({
        where: {
          paciente_id: patient.id,
          profesional_id: AFA_PROFESIONAL_ID,
          fecha: app.date,
          hora_inicio: startTime
        }
      });

      if (!turno) {
        turno = await Turno.create({
          paciente_id: patient.id,
          profesional_id: AFA_PROFESIONAL_ID,
          servicio_id: SERVICE_ID,
          fecha: app.date,
          hora_inicio: startTime,
          hora_fin: endTime,
          estado: 'Confirmado'
        });
      }
      
      const existingPrestacion = await Prestacion.findOne({
        where: {
          turno_id: turno.id
        }
      });

      if (!existingPrestacion) {
        await Prestacion.create({
          turno_id: turno.id,
          profesional_id: AFA_PROFESIONAL_ID,
          paciente_id: patient.id,
          servicio_id: SERVICE_ID,
          fecha: app.date,
          monto_total: 0,
          monto_profesional: 0,
          estado: 'Pendiente'
        });
      }
      
      console.log(`Added/Verified: ${app.patientName} at ${app.date} ${startTime}`);
    } catch (error) {
      console.error(`Error: ${app.patientName}:`, error.message);
    }
  }
  
  console.log('Migration for Arce finished!');
  process.exit(0);
}

run();
