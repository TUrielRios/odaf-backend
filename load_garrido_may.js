const { Turno, Paciente, ObraSocial } = require('./src/models');
const { Op } = require('sequelize');

const turnosData = [
  // May 4th
  { fecha: '2026-05-04', hora: '10:00:00', paciente: 'Varela Esther Noemi', os: 'Particular', notas: 'CR' },
  { fecha: '2026-05-04', hora: '10:30:00', paciente: 'Calvano Francisco Victor', os: 'IOMA', notas: 'A' },
  { fecha: '2026-05-04', hora: '11:00:00', paciente: 'Lopez Natta Macarena Belen', os: 'MEDIFE', notas: '' },
  { fecha: '2026-05-04', hora: '11:30:00', paciente: 'Arguello Norma', os: 'Particular', notas: 'CR' },
  { fecha: '2026-05-04', hora: '12:00:00', paciente: 'Pardo Victor Angel', os: 'Particular', notas: 'CR' },
  { fecha: '2026-05-04', hora: '14:00:00', paciente: 'Ibañez Javier Eugenio', os: 'Premedic', notas: 'CR' },
  { fecha: '2026-05-04', hora: '14:30:00', paciente: 'Soto Mayra Belen', os: 'Premedic', notas: 'RE' },
  { fecha: '2026-05-04', hora: '15:00:00', paciente: 'Martinez Damian Alejandro', os: 'PREMEDIC', notas: '' },
  { fecha: '2026-05-04', hora: '15:30:00', paciente: 'Anacondio Guadalupe', os: 'Particular', notas: 'p vez period' },
  { fecha: '2026-05-04', hora: '16:00:00', paciente: 'Pampin Daiana Pamela', os: 'OSPJN', notas: 'sabe qu' },
  { fecha: '2026-05-04', hora: '16:30:00', paciente: 'Nolasco Pilar', os: 'Particular', notas: 'CR' },
  { fecha: '2026-05-04', hora: '17:30:00', paciente: 'Thornton Nazarena', os: 'Particular', notas: 'CR' },
  { fecha: '2026-05-04', hora: '18:30:00', paciente: 'CORREA WALTER JOSE', os: 'PREMEDIC', notas: 'E' },

  // May 5th
  { fecha: '2026-05-05', hora: '10:00:00', paciente: 'Peralta Sol Daniela', os: 'SANCOR', notas: 'CR' },
  { fecha: '2026-05-05', hora: '15:30:00', paciente: 'Vera Giuliana', os: 'Galeno', notas: 'consulta' },
  { fecha: '2026-05-05', hora: '18:00:00', paciente: 'ROMAN AGUSTINA', os: 'SANCOR', notas: 'CR' },

  // May 11th
  { fecha: '2026-05-11', hora: '10:00:00', paciente: 'Porcellana Marcela Sandra', os: 'Particular', notas: 'CR' },
  { fecha: '2026-05-11', hora: '11:00:00', paciente: 'Francini Adrian Eduardo', os: 'Galeno', notas: 'r' },
  { fecha: '2026-05-11', hora: '17:00:00', paciente: 'POSTILLONE JOSE', os: 'Particular', notas: 'CR' },
  { fecha: '2026-05-11', hora: '17:30:00', paciente: 'Palacios Ricardo tomas ezequiel', os: 'Particular', notas: 'CR' },

  // May 12th
  { fecha: '2026-05-12', hora: '10:00:00', paciente: 'Gonzalez Andrea Fabiana', os: 'IOMA', notas: 'CR' },
  { fecha: '2026-05-12', hora: '15:00:00', paciente: 'Lissa Silvia', os: 'IOMA', notas: 'CR' },

  // May 18th
  { fecha: '2026-05-18', hora: '14:00:00', paciente: 'Vizcaino Pablo Gabriel', os: 'Particular', notas: 'RAR - CR' },

  // May 19th
  { fecha: '2026-05-19', hora: '10:00:00', paciente: 'Mansilla Vanina Elizabeth', os: 'Premedic 300', notas: '' },
  { fecha: '2026-05-19', hora: '18:00:00', paciente: 'Llanos Natasha micaela', os: 'Particular', notas: 'CIRUGIA ABO' }
];

async function main() {
  try {
    const garridoId = 6; // Dr GARRIDO T.

    console.log(`Iniciando carga de ${turnosData.length} turnos para el Dr. Garrido (ID ${garridoId}) para Mayo 2026...`);

    let creados = 0;
    let omitidos = 0;

    for (const data of turnosData) {
      // 1. Buscar o crear Obra Social
      let obraSocialId = null;
      if (data.os && data.os.toLowerCase() !== 'particular') {
        const [osRecord] = await ObraSocial.findOrCreate({
          where: { nombre: { [Op.iLike]: data.os } },
          defaults: { nombre: data.os }
        });
        obraSocialId = osRecord.id;
      }

      // 2. Buscar o crear Paciente
      const parts = data.paciente.split(' ');
      const apellido = parts[0];
      const nombre = parts.slice(1).join(' ') || '';

      const [paciente] = await Paciente.findOrCreate({
        where: {
          [Op.or]: [
            { nombre: { [Op.iLike]: nombre }, apellido: { [Op.iLike]: apellido } },
            { nombre: { [Op.iLike]: data.paciente }, apellido: { [Op.iLike]: '' } },
            { nombre: { [Op.iLike]: '' }, apellido: { [Op.iLike]: data.paciente } }
          ]
        },
        defaults: {
          nombre: nombre,
          apellido: apellido,
          obra_social_id: obraSocialId,
          tipo_documento: 'DNI',
          numero_documento: Math.floor(Math.random() * 100000000).toString(),
          fecha_nacimiento: '1990-01-01',
          sexo: 'Otro'
        }
      });

      // 3. Crear el Turno
      const existingTurno = await Turno.findOne({
        where: {
          profesional_id: garridoId,
          fecha: data.fecha,
          hora_inicio: data.hora
        }
      });

      if (!existingTurno) {
        // Calculate hora_fin (assume 30 mins slot)
        const [h, m] = data.hora.split(':').map(Number);
        const endH = m === 30 ? h + 1 : h;
        const endM = m === 30 ? '00' : '30';
        const hora_fin = `${endH.toString().padStart(2, '0')}:${endM}:00`;

        await Turno.create({
          profesional_id: garridoId,
          paciente_id: paciente.id,
          fecha: data.fecha,
          hora_inicio: data.hora,
          hora_fin: hora_fin,
          estado: 'Confirmado', // All blue dots in image seem to imply confirmed in the old system standard
          notas: data.notas,
          servicio_id: 1
        });
        console.log(`[EXITO] Turno creado: ${data.fecha} ${data.hora} - ${data.paciente}`);
        creados++;
      } else {
        console.log(`[OMITIDO] Ya existe un turno el ${data.fecha} a las ${data.hora}`);
        omitidos++;
      }
    }

    console.log(`\n¡Carga finalizada! Creados: ${creados}, Omitidos (ya existían): ${omitidos}`);
  } catch (error) {
    console.error('Error durante la carga:', error);
  } finally {
    process.exit();
  }
}

main();
