const { sequelize, Paciente, Turno, Prestacion, Profesional, Servicio, ObraSocial } = require('../models');
const { Op } = require('sequelize');

const PROFESIONAL_ID = 7; // Garofolo FLORENCIA
const SERVICIO_ID = 7;    // Odontología general
const DURACION_ESTIMADA = 30;

const APPOINTMENTS_DATA = [
  // Lunes 4 de Mayo
  { fecha: '2026-05-04', hora: '09:00', paciente: 'PACIENTE CONTROL' },
  { fecha: '2026-05-04', hora: '10:00', paciente: 'PENACINI DIMOTTA MAGALI' },
  { fecha: '2026-05-04', hora: '10:00', paciente: 'Varaldo Camila denise' },
  { fecha: '2026-05-04', hora: '10:30', paciente: 'Niveiro Karen Magali' },
  { fecha: '2026-05-04', hora: '11:00', paciente: 'MALDONADO BAUTISTA', obra_social: 'premedic' },
  { fecha: '2026-05-04', hora: '11:00', paciente: 'ROMANO VALDEZ BRIANA' },
  { fecha: '2026-05-04', hora: '11:30', paciente: 'Crispi Emmanuel Gabriel' },
  { fecha: '2026-05-04', hora: '12:00', paciente: 'AQUINO LARA' },
  { fecha: '2026-05-04', hora: '12:30', paciente: 'MANZANEL CARLA DANIELA' },
  { fecha: '2026-05-04', hora: '14:00', paciente: 'Silva Alberto Ezequiel' },
  { fecha: '2026-05-04', hora: '14:30', paciente: 'Molina Maximiliano' },
  { fecha: '2026-05-04', hora: '15:00', paciente: 'OVANDO ANDREA CELESTE' },
  { fecha: '2026-05-04', hora: '15:30', paciente: 'BRAVO PATRICIA', obra_social: 'premedic' },
  { fecha: '2026-05-04', hora: '16:00', paciente: 'BARRERA MARTINEZ BIANCA' },
  { fecha: '2026-05-04', hora: '17:00', paciente: 'Esquivel Alejandro Cristian' },
  { fecha: '2026-05-04', hora: '17:30', paciente: 'BASTIAN PAOLA', obra_social: 'premedic' },
  { fecha: '2026-05-04', hora: '17:30', paciente: 'Del Castillo Pablo Walter' },
  { fecha: '2026-05-04', hora: '18:00', paciente: 'Aguilera escobar Micaela' },
  { fecha: '2026-05-04', hora: '18:30', paciente: 'SAINA NICOLAS ADRIAN' },

  // Martes 5 de Mayo
  { fecha: '2026-05-05', hora: '09:00', paciente: 'ARIAS TITO LIVIO', obra_social: 'pami' },
  { fecha: '2026-05-05', hora: '09:30', paciente: 'PEREYRA SANDRA', obra_social: 'pami' },
  { fecha: '2026-05-05', hora: '10:00', paciente: 'RAMIREZ ELIDA MIRTA', obra_social: 'pami' },
  { fecha: '2026-05-05', hora: '10:30', paciente: 'DELGADO OSCAR EDMUNDO' },
  { fecha: '2026-05-05', hora: '11:00', paciente: 'UASUF PAOLA ANDREA', obra_social: 'pami' },
  { fecha: '2026-05-05', hora: '11:30', paciente: 'ALOI ANA MARIA', obra_social: 'pami' },
  { fecha: '2026-05-05', hora: '12:00', paciente: 'CARRETERO STELLA MARIS' },
  { fecha: '2026-05-05', hora: '12:00', paciente: 'LINARI OSCAR HUMBERTO' },
  { fecha: '2026-05-05', hora: '12:30', paciente: 'ZABALA EDUARDO ALBERTO' },
  { fecha: '2026-05-05', hora: '16:30', paciente: 'Santos Juan Manuel' },
  { fecha: '2026-05-05', hora: '17:00', paciente: 'MUTTE ROXANA ALICIA' },
  { fecha: '2026-05-05', hora: '17:30', paciente: 'VALDIVIESO CECILIA' },
  { fecha: '2026-05-05', hora: '18:00', paciente: 'PACIENTE CONTROL' },

  // Miércoles 6 de Mayo
  { fecha: '2026-05-06', hora: '08:00', paciente: 'AVACA SILVIA ADELINA' },
  { fecha: '2026-05-06', hora: '08:00', paciente: 'Pinella Miriam Beatriz', obra_social: 'pami' },
  { fecha: '2026-05-06', hora: '08:30', paciente: 'BAVA SANTIAGO LUIS', obra_social: 'pami' },
  { fecha: '2026-05-06', hora: '09:30', paciente: 'Villasboa Hernan Alberto' },
  { fecha: '2026-05-06', hora: '12:00', paciente: 'PACIENTE CONTROL' },

  // Jueves 7 de Mayo
  { fecha: '2026-05-07', hora: '09:00', paciente: 'FERNANDEZ EMMA', obra_social: 'pami' },
  { fecha: '2026-05-07', hora: '09:30', paciente: 'MARTIN ORLANDO LUIS', obra_social: 'pami' },
  { fecha: '2026-05-07', hora: '10:00', paciente: 'SANCHEZ MIRIAM LILIAN', obra_social: 'pami' },
  { fecha: '2026-05-07', hora: '10:30', paciente: 'BRITEZ RAMIREZ ISABEL' },
  { fecha: '2026-05-07', hora: '11:00', paciente: 'GNESUTTA NANCY LILIAN', obra_social: 'pami' },
  { fecha: '2026-05-07', hora: '11:30', paciente: 'JIMENEZ MIRIAM ELISABET' },
  { fecha: '2026-05-07', hora: '12:00', paciente: 'MANSILLA SONIA GRACIELA' },
  { fecha: '2026-05-07', hora: '12:00', paciente: 'NIEVA BEATRIZ', obra_social: 'pami' },
  { fecha: '2026-05-07', hora: '12:30', paciente: 'PIÑERO NORA RITA', obra_social: 'pami' },
  { fecha: '2026-05-07', hora: '14:00', paciente: 'Villarroel Emanuel', obra_social: 'sancor' },
  { fecha: '2026-05-07', hora: '14:30', paciente: 'Quiroga Jaquiline Monica' },
  { fecha: '2026-05-07', hora: '14:30', paciente: 'REYNOSO ORNELLA AGUSTINA' },
  { fecha: '2026-05-07', hora: '15:30', paciente: 'ENLAIP MATIAS EZEQUIEL' },
  { fecha: '2026-05-07', hora: '15:30', paciente: 'Forcinitti Jonatan Silvio' },
  { fecha: '2026-05-07', hora: '16:00', paciente: 'Bevevino Catarina', obra_social: 'sancor' },
  { fecha: '2026-05-07', hora: '17:00', paciente: 'CHINELATTO CINTHIA NATALIA' },
  { fecha: '2026-05-07', hora: '17:30', paciente: 'BENITEZ GUSTAVO ADOLFO' },
  { fecha: '2026-05-07', hora: '18:00', paciente: 'PACIENTE CONTROL' },

  // Lunes 11 de Mayo
  { fecha: '2026-05-11', hora: '09:00', paciente: 'PACIENTE CONTROL' },
  { fecha: '2026-05-11', hora: '10:00', paciente: 'Alvarez Dylan', obra_social: 'premedic' },
  { fecha: '2026-05-11', hora: '16:00', paciente: 'Quiñonez Franco Daniel' },
  { fecha: '2026-05-11', hora: '17:00', paciente: 'Rehlinger Irene' },

  // Martes 12 de Mayo
  { fecha: '2026-05-12', hora: '09:00', paciente: 'VITA ROBERTO', obra_social: 'pami' },
  { fecha: '2026-05-12', hora: '09:30', paciente: 'DANDREA SUSANA', obra_social: 'pami' },
  { fecha: '2026-05-12', hora: '10:00', paciente: 'PELLEGRINO MARIA DEL CARMEN' },
  { fecha: '2026-05-12', hora: '11:30', paciente: 'VARGAS ALBERTO OSCAR' },
  { fecha: '2026-05-12', hora: '12:00', paciente: 'GUIMARD CONTRERAS LOURDES' },
  { fecha: '2026-05-12', hora: '12:30', paciente: 'GALEANO MARIA LUISA', obra_social: 'pami' },
  { fecha: '2026-05-12', hora: '16:00', paciente: 'Carrizo Mena Dante Joaquin' },
  { fecha: '2026-05-12', hora: '18:00', paciente: 'PACIENTE CONTROL' },

  // Miércoles 13 de Mayo
  { fecha: '2026-05-13', hora: '08:00', paciente: 'RIVAS GABRIELA EDITH', obra_social: 'pami' },
  { fecha: '2026-05-13', hora: '12:00', paciente: 'PACIENTE CONTROL' },

  // Jueves 14 de Mayo
  { fecha: '2026-05-14', hora: '09:00', paciente: 'GOMEZ MANSILLA AGOSTINA' },
  { fecha: '2026-05-14', hora: '09:30', paciente: 'MARDONES FEDERICO', obra_social: 'pami' },
  { fecha: '2026-05-14', hora: '10:30', paciente: 'FARIAS ELENA ALICIA', obra_social: 'pami' },
  { fecha: '2026-05-14', hora: '11:30', paciente: 'Bojarski Rosa', obra_social: 'pami' },
  { fecha: '2026-05-14', hora: '12:00', paciente: 'Benedetti Jose Alberto', obra_social: 'pami' },
  { fecha: '2026-05-14', hora: '12:30', paciente: 'VAZQUEZ OSCAR', obra_social: 'pami' },
  { fecha: '2026-05-14', hora: '14:00', paciente: 'Gonzalez Sandra Karina', obra_social: 'premedic' },
  { fecha: '2026-05-14', hora: '16:00', paciente: 'Buscarioli Fernando Daniel' },
  { fecha: '2026-05-14', hora: '17:30', paciente: 'Barranco Monica Gabriela' },
  { fecha: '2026-05-14', hora: '18:00', paciente: 'PACIENTE CONTROL' },

  // Lunes 18 de Mayo
  { fecha: '2026-05-18', hora: '09:00', paciente: 'PACIENTE CONTROL' },
  { fecha: '2026-05-18', hora: '14:30', paciente: 'CASACCIA TATIANA BELEN' },

  // Martes 19 de Mayo
  { fecha: '2026-05-19', hora: '09:00', paciente: 'BAILO OSCAR ALBERTO', obra_social: 'pami' },
  { fecha: '2026-05-19', hora: '09:30', paciente: 'BALEATO REY MARIA FLORENCIA' },
  { fecha: '2026-05-19', hora: '10:00', paciente: 'IGLESIAS JOSE ENRIQUE', obra_social: 'pami' },
  { fecha: '2026-05-19', hora: '10:30', paciente: 'FRIAS IARA AGUSTINA', obra_social: 'pami' },
  { fecha: '2026-05-19', hora: '11:00', paciente: 'IDOETA LIA TRINIDAD', obra_social: 'pami' },
  { fecha: '2026-05-19', hora: '11:30', paciente: 'ALOI ANA MARIA', obra_social: 'pami' },
  { fecha: '2026-05-19', hora: '12:00', paciente: 'BLANCO ESTELA GLADYS', obra_social: 'pami' },
  { fecha: '2026-05-19', hora: '12:30', paciente: 'SORIA KARINA JESICA', obra_social: 'pami' },
  { fecha: '2026-05-19', hora: '17:30', paciente: 'Aldecoa Ana Belen' },
  { fecha: '2026-05-19', hora: '18:00', paciente: 'PACIENTE CONTROL' },

  // Miércoles 20 de Mayo
  { fecha: '2026-05-20', hora: '11:30', paciente: 'PACIENTE CONTROL' },

  // Jueves 21 de Mayo
  { fecha: '2026-05-21', hora: '09:00', paciente: 'VALDIVIESO OSVALDO RAUL', obra_social: 'pami' },
  { fecha: '2026-05-21', hora: '09:30', paciente: 'Burja Esteban', obra_social: 'pami' },
  { fecha: '2026-05-21', hora: '11:30', paciente: 'EDWIN ELEONORA ANGEL' },
  { fecha: '2026-05-21', hora: '12:00', paciente: 'SARRABEYROUSE VICENTE FELIX' },
  { fecha: '2026-05-21', hora: '12:30', paciente: 'SIMON CARMEN', obra_social: 'pami' },
  { fecha: '2026-05-21', hora: '18:00', paciente: 'PACIENTE CONTROL' },
  { fecha: '2026-05-21', hora: '18:00', paciente: 'PACIENTE CONTROL' }, // Doble reserva

  // Martes 26 de Mayo
  { fecha: '2026-05-26', hora: '12:30', paciente: 'THENEE DORA EMA', obra_social: 'pami' },
  { fecha: '2026-05-26', hora: '18:00', paciente: 'PACIENTE CONTROL' },

  // Miércoles 27 de Mayo
  { fecha: '2026-05-27', hora: '12:00', paciente: 'PACIENTE CONTROL' },

  // Jueves 28 de Mayo
  { fecha: '2026-05-28', hora: '09:00', paciente: 'DE MAYOLAS ALEJANDRO' },
  { fecha: '2026-05-28', hora: '09:30', paciente: 'VIO ANA MIREYA', obra_social: 'pami' },
  { fecha: '2026-05-28', hora: '18:00', paciente: 'PACIENTE CONTROL' },

  // Lunes 1 de Junio
  { fecha: '2026-06-01', hora: '10:00', paciente: 'Gamez Matias Ezequiel' },

  // Jueves 4 de Junio
  { fecha: '2026-06-04', hora: '09:00', paciente: 'VILLOLDO ELSA VIVIANA', obra_social: 'pami' }
];

const OBRA_SOCIAL_MAPPING = {
  'ioma': 1,
  'sancor': 10,
  'pami': 26,
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
  console.log('Iniciando migración masiva para Florencia Garofolo (GFJ)...');
  
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
