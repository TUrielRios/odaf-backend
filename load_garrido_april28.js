const { Turno, Paciente, Profesional, ObraSocial } = require('./src/models');
const { Op } = require('sequelize');

const turnosData = [
  { hora: '08:00:00', paciente: 'Vera Giuliana', os: 'Galeno', notas: 'consulta per' },
  { hora: '10:30:00', paciente: 'Alvarez Juan Cruz', os: 'SANCOR', notas: 'CW' },
  { hora: '11:00:00', paciente: 'Johansen Genesis', os: 'Premedic C100', notas: 'CW' },
  { hora: '11:30:00', paciente: 'CALABRO MARIA PAULA', os: 'Particular', notas: '' },
  { hora: '12:00:00', paciente: 'Andraud Denisse', os: 'Premedic', notas: 'CW' },
  { hora: '14:00:00', paciente: 'Garcia GABY', os: 'PARTICULAR', notas: 'CW' },
  { hora: '14:30:00', paciente: 'SERRANO MARTA BEATRIZ', os: 'IOMA', notas: 'CW' },
  { hora: '15:00:00', paciente: 'Jaimes Penayo Lucila Belen', os: 'Particular', notas: 'EC' },
  { hora: '16:00:00', paciente: 'Sanchez Klein Victoria Lucia', os: 'Particular', notas: 'CW' },
  { hora: '16:30:00', paciente: 'Figuerero Mercedes Roxana', os: 'Particular', notas: 'CW' },
  { hora: '17:00:00', paciente: 'CORREA WALTER JOSE', os: 'PREMEDIC', notas: 'ENT' },
  { hora: '18:30:00', paciente: 'Rojas Nerina', os: 'OMINT', notas: 'TRABAJAN' }
];

async function main() {
  try {
    const garridoId = 6; // Dr GARRIDO T.
    const fecha = '2026-04-28';

    console.log(`Iniciando carga de ${turnosData.length} turnos para el Dr. Garrido (ID ${garridoId}) el ${fecha}...`);

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
      // Asumimos que el formato es Apellido Nombre o similar, lo guardamos entero en "apellido" y "nombre" vacío, o dividido
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
      // Check if it already exists to avoid duplicates
      const existingTurno = await Turno.findOne({
        where: {
          profesional_id: garridoId,
          fecha: fecha,
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
          fecha: fecha,
          hora_inicio: data.hora,
          hora_fin: hora_fin,
          estado: data.hora === '08:00:00' ? 'Pendiente' : 'Confirmado', // Red dot for 8:00, rest green/yellow
          notas: data.notas,
          servicio_id: 1 // Default to general dentistry or first consultation
        });
        console.log(`[EXITO] Turno creado: ${data.hora} - ${data.paciente}`);
      } else {
        console.log(`[OMITIDO] Ya existe un turno a las ${data.hora}`);
      }
    }

    console.log('\n¡Todos los turnos de Garrido cargados exitosamente!');
  } catch (error) {
    console.error('Error durante la carga:', error);
  } finally {
    process.exit();
  }
}

main();
