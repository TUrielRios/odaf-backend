const { sequelize, Paciente, Turno, Prestacion, Profesional, Servicio } = require('../models');
const { Op } = require('sequelize');

const PROFESIONAL_ID = 7; // Garofolo FLORENCIA
const SERVICIO_ID = 7;    // Odontología general
const DURACION_ESTIMADA = 30;
const OBRA_SOCIAL_PAMI_ID = 26;

const APPOINTMENTS_DATA = [
  // ================= SEMANA 1 =================
  // Miércoles 1 de Julio, 2026
  { fecha: '2026-07-01', hora: '11:00', paciente: 'THENEE DORA EMA', obra_social: 'pami' },
  // Jueves 2: CURSO (Omitido por ser un bloqueo)

  // ================= SEMANA 2 =================
  // Martes 7 de Julio, 2026
  { fecha: '2026-07-07', hora: '09:00', paciente: 'Burja Esteban', obra_social: 'pami' },
  { fecha: '2026-07-07', hora: '09:00', paciente: 'petreniuk german', obra_social: 'pami', dni: '11708146' },
  { fecha: '2026-07-07', hora: '09:30', paciente: 'LARREA CARLOS ALBERTO', obra_social: 'pami' },
  { fecha: '2026-07-07', hora: '10:00', paciente: 'HARTKOPF GUILLERMO', obra_social: 'pami' },
  { fecha: '2026-07-07', hora: '10:30', paciente: 'Carrion Jose Luis', obra_social: 'pami' },
  { fecha: '2026-07-07', hora: '11:00', paciente: 'Diaz Maria Fernanda', obra_social: 'pami' },
  { fecha: '2026-07-07', hora: '11:30', paciente: 'SORIA KARINA JESICA', obra_social: 'pami' },
  { fecha: '2026-07-07', hora: '12:00', paciente: 'PONCE PATRICIA ANTONIA', obra_social: 'pami' },
  { fecha: '2026-07-07', hora: '12:30', paciente: 'BORRAJO IRMA BEATRIZ', obra_social: 'pami' },

  // ================= SEMANA 3 =================
  // Martes 14 de Julio, 2026
  { fecha: '2026-07-14', hora: '09:00', paciente: 'LOPEZ LILIANA BEATRIZ', obra_social: 'pami' },
  { fecha: '2026-07-14', hora: '09:30', paciente: 'FRIAS IARA AGUSTINA', obra_social: 'pami' },
  { fecha: '2026-07-14', hora: '11:30', paciente: 'Fuentes Claudia', obra_social: 'pami' },
  { fecha: '2026-07-14', hora: '12:00', paciente: 'SARRABEYROUSE VICENTE F', obra_social: 'pami' },
  { fecha: '2026-07-14', hora: '12:30', paciente: 'BENITEZ STEPHANIE LOR', obra_social: 'pami' },

  // Jueves 16 de Julio, 2026
  { fecha: '2026-07-16', hora: '09:00', paciente: 'DAMIANO MARIA', obra_social: 'pami' },
  { fecha: '2026-07-16', hora: '09:30', paciente: 'DOMINGO AIDA ISABEL', obra_social: 'pami' }
];

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
  console.log('Iniciando migración corregida para Florencia Garofolo (GFJ) de Julio 2026...');
  
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
        paciente = await Paciente.create({
          nombre,
          apellido,
          numero_documento: data.dni || generateDummyDNI(data.paciente),
          tipo_documento: 'DNI',
          obra_social_id: OBRA_SOCIAL_PAMI_ID,
          estado: 'Activo',
          condicion: 'Activo',
          fecha_nacimiento: '2000-01-01',
          sexo: 'Otro'
        }, { transaction: t });
        console.log(`✓ Paciente creado: ${nombre} ${apellido}`);
      } else if (data.dni && paciente.numero_documento !== data.dni) {
        // Actualizar DNI si se provee uno real y tiene uno dummy
        paciente.numero_documento = data.dni;
        await paciente.save({ transaction: t });
        console.log(`✓ DNI actualizado para ${nombre} ${apellido} a ${data.dni}`);
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
