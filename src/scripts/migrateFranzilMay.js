const { sequelize, Paciente, Turno, Prestacion, Profesional, Servicio, ObraSocial } = require('../models');
const { Op } = require('sequelize');

const PROFESIONAL_ID = 4; // Franzil ADRIANA
const SERVICIO_ID = 4;    // Ortopedia de los maxilares
const DURACION_ESTIMADA = 30;

const APPOINTMENTS_DATA = [
  // Miércoles 29 de Abril
  { fecha: '2026-04-29', hora: '13:30', paciente: 'PACIENTE CONTROL' },

  // Miércoles 6 de Mayo
  { fecha: '2026-05-06', hora: '10:00', paciente: 'Corral Melody' },
  { fecha: '2026-05-06', hora: '11:00', paciente: 'PACIENTE CONTROL' },
  { fecha: '2026-05-06', hora: '14:00', paciente: 'Santillan Facundo' },
  { fecha: '2026-05-06', hora: '14:30', paciente: 'Mendiaz Pedreira Lucia' },
  { fecha: '2026-05-06', hora: '15:00', paciente: 'Ferreyra Cruces Christian' },
  { fecha: '2026-05-06', hora: '15:00', paciente: 'Mendoza Aviles Lola', obra_social: 'ioma' },
  { fecha: '2026-05-06', hora: '15:30', paciente: 'PACIENTE CONTROL' },

  // Jueves 7 de Mayo
  { fecha: '2026-05-07', hora: '14:00', paciente: 'Nicieza Posteraro Bianca' },

  // Miércoles 13 de Mayo
  { fecha: '2026-05-13', hora: '09:00', paciente: 'PACIENTE CONTROL' },
  { fecha: '2026-05-13', hora: '10:30', paciente: 'Gomez Benjamin' },
  { fecha: '2026-05-13', hora: '11:00', paciente: 'Hergenreder Aramis' },
  { fecha: '2026-05-13', hora: '14:00', paciente: 'Martinez Amy', obra_social: 'premedic' },
  { fecha: '2026-05-13', hora: '14:30', paciente: 'Martinez Zoe', obra_social: 'premedic' },
  { fecha: '2026-05-13', hora: '15:00', paciente: 'Aguero Quesus Bianca' },

  // Jueves 14 de Mayo
  { fecha: '2026-05-14', hora: '14:00', paciente: 'Nicieza Posteraro Bianca' },

  // Miércoles 20 de Mayo
  { fecha: '2026-05-20', hora: '09:00', paciente: 'PACIENTE CONTROL' },

  // Miércoles 27 de Mayo
  { fecha: '2026-05-27', hora: '09:00', paciente: 'PACIENTE CONTROL' }
];

const OBRA_SOCIAL_MAPPING = {
  'ioma': 1,
  'premedic': 58,
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
  if (name === 'PACIENTE CONTROL') return '00000000';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return '99' + Math.abs(hash).toString().substring(0, 6);
}

async function migrate() {
  console.log('Iniciando migración de turnos para Adriana Franzil (AF)...');
  
  const t = await sequelize.transaction();
  
  try {
    const prof = await Profesional.findByPk(PROFESIONAL_ID);
    const serv = await Servicio.findByPk(SERVICIO_ID);
    
    if (!prof || !serv) {
      throw new Error('Profesional o Servicio no encontrado');
    }

    let createdCount = 0;
    
    for (const data of APPOINTMENTS_DATA) {
      // Verificar duplicados para este profesional
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
            {
              nombre: { [Op.iLike]: `%${nombre}%` },
              apellido: { [Op.iLike]: `%${apellido}%` }
            },
            {
              nombre: { [Op.iLike]: `%${apellido}%` },
              apellido: { [Op.iLike]: `%${nombre}%` }
            }
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
