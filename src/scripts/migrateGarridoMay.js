const { sequelize, Paciente, Turno, Prestacion, Profesional, Servicio, ObraSocial } = require('../models');
const { Op } = require('sequelize');

const PROFESIONAL_ID = 6; // Garrido THOMAS
const SERVICIO_ID = 7;    // Odontología general
const DURACION_ESTIMADA = 30; // 30 min por defecto

const APPOINTMENTS_DATA = [
  // Lunes 11 de Mayo
  { fecha: '2026-05-11', hora: '17:00', paciente: 'POSTILLONE JOSE' },
  { fecha: '2026-05-11', hora: '17:30', paciente: 'Palacios Ricardo' },

  // Martes 12 de Mayo
  { fecha: '2026-05-12', hora: '10:00', paciente: 'Gonzalez Andrea Fabiana' },

  // Martes 19 de Mayo
  { fecha: '2026-05-19', hora: '18:00', paciente: 'Llanos Natasha micaela' },

  // Lunes 1 de Junio
  { fecha: '2026-06-01', hora: '10:00', paciente: 'ROGER GLADYS BERSAVICH' }
];

function splitName(fullName) {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return { nombre: parts[0], apellido: 'S/A' };
  
  const apellido = parts[0];
  const nombre = parts.slice(1).join(' ');
  return { nombre: nombre || apellido, apellido };
}

function generateDummyDNI(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return '99' + Math.abs(hash).toString().substring(0, 6);
}

async function migrate() {
  console.log('Iniciando migración de turnos para Thomas Garrido (Mayo)...');
  
  const t = await sequelize.transaction();
  
  try {
    const prof = await Profesional.findByPk(PROFESIONAL_ID);
    const serv = await Servicio.findByPk(SERVICIO_ID);
    
    if (!prof || !serv) {
      throw new Error('Profesional o Servicio no encontrado');
    }

    let createdCount = 0;
    
    for (const data of APPOINTMENTS_DATA) {
      // Verificar si el turno ya existe para evitar duplicados
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
        paciente = await Paciente.create({
          nombre,
          apellido,
          numero_documento: generateDummyDNI(data.paciente),
          tipo_documento: 'DNI',
          obra_social_id: 4, // Particular
          estado: 'Activo',
          condicion: 'Activo',
          fecha_nacimiento: '2000-01-01',
          sexo: 'Otro'
        }, { transaction: t });
        console.log(`✓ Paciente creado: ${nombre} ${apellido}`);
      } else {
        console.log(`ℹ Paciente encontrado: ${paciente.nombre} ${paciente.apellido}`);
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
    await t.rollback();
    console.error('Error durante la migración:', error);
  } finally {
    process.exit();
  }
}

migrate();
