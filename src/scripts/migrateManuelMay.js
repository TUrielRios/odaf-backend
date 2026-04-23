const { sequelize, Paciente, Turno, Prestacion, Profesional, Servicio, ObraSocial } = require('../models');
const { Op } = require('sequelize');

const PROFESIONAL_ID = 17; // Manuel Leon Rincones
const SERVICIO_ID = 7;     // Odontología general
const DURACION_ESTIMADA = 30;

const APPOINTMENTS_DATA = [
  // Lunes 4 de Mayo
  { fecha: '2026-05-04', hora: '10:00', paciente: 'Pamela Samanta Gonzalez' },
  { fecha: '2026-05-04', hora: '10:30', paciente: 'Alli Florencia Emilia' },
  { fecha: '2026-05-04', hora: '11:30', paciente: 'MALDONADO WALTER', obra_social: 'premedic' },
  { fecha: '2026-05-04', hora: '14:00', paciente: 'RUIZ EVANGELINA', obra_social: 'sancor' },
  { fecha: '2026-05-04', hora: '14:30', paciente: 'Syiani Hannah', obra_social: 'omint' },
  { fecha: '2026-05-04', hora: '17:00', paciente: 'GONZALEZ KARINA MARCELA' },
  { fecha: '2026-05-04', hora: '17:30', paciente: 'Gutierrez MEDRANO JOAQUIN' },

  // Viernes 8 de Mayo
  { fecha: '2026-05-08', hora: '08:00', paciente: 'PACIENTE CONTROL' },
  { fecha: '2026-05-08', hora: '11:00', paciente: 'Mendoza Michael Alexander' },
  { fecha: '2026-05-08', hora: '14:00', paciente: 'Margaria Raul Alberto', obra_social: 'particular' },
  { fecha: '2026-05-08', hora: '16:00', paciente: 'ROMERO RUIZ VICTORIA', obra_social: 'sancor' },
  { fecha: '2026-05-08', hora: '16:30', paciente: 'ROMERO RUIZ IGNACIO', obra_social: 'sancor' },
  { fecha: '2026-05-08', hora: '17:00', paciente: 'PACIENTE CONTROL' }
];

const OBRA_SOCIAL_MAPPING = {
  'sancor': 10,
  'premedic': 58,
  'omint': 43,
  'particular': 4
};

function splitName(fullName) {
  if (fullName === 'PACIENTE CONTROL') return { nombre: 'CONTROL', apellido: 'PACIENTE' };
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return { nombre: parts[0], apellido: 'S/A' };
  
  const apellido = parts[0];
  const nombre = parts.slice(1).join(' ');
  return { nombre: nombre || apellido, apellido };
}

function generateDummyDNI(name) {
  if (name === 'PACIENTE CONTROL') return '00000000_MR'; // Sufijo para evitar colisiones totales si se desea, o el mismo
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return '99' + Math.abs(hash).toString().substring(0, 6);
}

async function migrate() {
  console.log('Iniciando migración de turnos para Manuel Leon Rincones (MR)...');
  
  const t = await sequelize.transaction();
  
  try {
    const prof = await Profesional.findByPk(PROFESIONAL_ID);
    const serv = await Servicio.findByPk(SERVICIO_ID);
    
    if (!prof || !serv) throw new Error('Profesional o Servicio no encontrado');

    let createdCount = 0;
    
    for (const data of APPOINTMENTS_DATA) {
      // Verificar duplicados
      const existingTurno = await Turno.findOne({
        where: {
          profesional_id: PROFESIONAL_ID,
          fecha: data.fecha,
          hora_inicio: `${data.hora}:00`
        },
        transaction: t
      });

      if (existingTurno) {
        console.log(`- Turno ya existe para ${data.paciente} el ${data.fecha} a las ${data.hora}. Saltando...`);
        continue;
      }

      const { nombre, apellido } = splitName(data.paciente);
      
      // Buscar paciente o crear
      let paciente = await Paciente.findOne({
        where: {
          [Op.or]: [
            { nombre: { [Op.iLike]: `%${nombre}%` }, apellido: { [Op.iLike]: `%${apellido}%` } },
            { nombre: { [Op.iLike]: `%${apellido}%` }, apellido: { [Op.iLike]: `%${nombre}%` } }
          ]
        },
        transaction: t
      });
      
      if (!paciente) {
        const obra_social_id = OBRA_SOCIAL_MAPPING[data.obra_social] || 4;
        paciente = await Paciente.create({
          nombre,
          apellido,
          numero_documento: generateDummyDNI(data.paciente),
          tipo_documento: 'DNI',
          obra_social_id,
          estado: 'Activo',
          condicion: 'Activo',
          fecha_nacimiento: '2000-01-01',
          sexo: 'Otro'
        }, { transaction: t });
        console.log(`✓ Paciente creado: ${nombre} ${apellido}`);
      }

      // Calcular hora fin
      const [h, m] = data.hora.split(':');
      const date = new Date(2000, 0, 1, parseInt(h), parseInt(m));
      date.setMinutes(date.getMinutes() + DURACION_ESTIMADA);
      const hora_fin = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:00`;

      // Crear Turno
      const turno = await Turno.create({
        paciente_id: paciente.id,
        profesional_id: PROFESIONAL_ID,
        servicio_id: SERVICIO_ID,
        fecha: data.fecha,
        hora_inicio: `${data.hora}:00`,
        hora_fin: hora_fin,
        estado: 'Confirmado',
        pago_confirmado: false
      }, { transaction: t });

      // Crear Prestacion
      await Prestacion.create({
        profesional_id: PROFESIONAL_ID,
        paciente_id: paciente.id,
        servicio_id: SERVICIO_ID,
        turno_id: turno.id,
        fecha: data.fecha,
        monto_total: serv.precio_base,
        porcentaje_profesional: prof.porcentaje_comision,
        monto_profesional: (serv.precio_base * prof.porcentaje_comision) / 100,
        estado: 'Pendiente',
        descripcion: serv.nombre
      }, { transaction: t });

      createdCount++;
      console.log(`  - Turno migrado para ${data.paciente} el ${data.fecha} a las ${data.hora}`);
    }

    await t.commit();
    console.log(`\nMigración finalizada con éxito. ${createdCount} turnos migrados.`);
    
  } catch (error) {
    if (t) await t.rollback();
    console.error('Error durante la migración:', error);
  } finally {
    process.exit();
  }
}

migrate();
