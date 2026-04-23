const { sequelize, Paciente, Turno, Prestacion, Profesional, Servicio, ObraSocial } = require('../models');
const { Op } = require('sequelize');

const PROFESIONAL_ID = 6; // Garrido THOMAS
const SERVICIO_ID = 7;    // Odontología general
const DURACION_ESTIMADA = 30; // 30 min por defecto

const APPOINTMENTS_DATA = [
  // Lunes 20 de Abril
  { fecha: '2026-04-20', hora: '08:00', paciente: 'Marciali Rocio Agustina' },
  { fecha: '2026-04-20', hora: '10:00', paciente: 'ROGER GLADYS BERSAVICH' },
  { fecha: '2026-04-20', hora: '10:30', paciente: 'CORREA WALTER JOSE' },
  { fecha: '2026-04-20', hora: '11:00', paciente: 'VILLARREAL CRISTIAN' },
  { fecha: '2026-04-20', hora: '12:00', paciente: 'Francini Adrian Eduardo' },
  { fecha: '2026-04-20', hora: '12:30', paciente: 'Varela Esther Noemi' },
  { fecha: '2026-04-20', hora: '14:00', paciente: 'GONZALEZ MARIA MAGDALENA' },
  { fecha: '2026-04-20', hora: '14:30', paciente: 'Soto Mayra Belen' },
  { fecha: '2026-04-20', hora: '15:30', paciente: 'Nolasco Pilar' },
  { fecha: '2026-04-20', hora: '16:00', paciente: 'Boggio Cristina Monica' },
  { fecha: '2026-04-20', hora: '16:30', paciente: 'Acuña De Luca Ana' },
  { fecha: '2026-04-20', hora: '17:30', paciente: 'ROSAS SABRINA' },
  { fecha: '2026-04-20', hora: '18:00', paciente: 'Valenzuela Evelin Sanchez' },

  // Martes 21 de Abril
  { fecha: '2026-04-21', hora: '10:00', paciente: 'Calvano Francisco Victor' },
  { fecha: '2026-04-21', hora: '11:00', paciente: 'Lissa Silvia', obra_social: 'ioma' },
  { fecha: '2026-04-21', hora: '12:00', paciente: 'Ziegler Yanina Belen' },
  { fecha: '2026-04-21', hora: '12:30', paciente: 'Diez Jorge Omar' },
  { fecha: '2026-04-21', hora: '14:00', paciente: 'Conde Florencia Ines' },
  { fecha: '2026-04-21', hora: '14:30', paciente: 'Di Filippo Andrea Cecilia' },
  { fecha: '2026-04-21', hora: '15:00', paciente: 'Vizcaino Pablo Gabriel' },
  { fecha: '2026-04-21', hora: '17:00', paciente: 'FORCINITO SARA', obra_social: 'part' },
  { fecha: '2026-04-21', hora: '17:30', paciente: 'Mayra Alejandra Gonzalez' },
  { fecha: '2026-04-21', hora: '18:00', paciente: 'Robledo Facundo Nicolas' },
  { fecha: '2026-04-21', hora: '18:30', paciente: 'Carrizo Mariela Lucia' },
  { fecha: '2026-04-21', hora: '18:30', paciente: 'VIOLI PILAR GALENC' },

  // Lunes 27 de Abril
  { fecha: '2026-04-27', hora: '10:00', paciente: 'Mansilla Vanina Elizabeth' },
  { fecha: '2026-04-27', hora: '10:00', paciente: 'Brusoz Julia Bettiana' },
  { fecha: '2026-04-27', hora: '11:30', paciente: 'Peralta Sol Daniela' },

  // Martes 28 de Abril
  { fecha: '2026-04-28', hora: '14:00', paciente: 'Garcia GABY', obra_social: 'part' },
  { fecha: '2026-04-28', hora: '15:00', paciente: 'Jaimes Penayo Lucila' },
  { fecha: '2026-04-28', hora: '16:30', paciente: 'Figuerero Mercedes' },
  { fecha: '2026-04-28', hora: '17:00', paciente: 'CORREA WALTER JOSE I' },
  { fecha: '2026-04-28', hora: '18:30', paciente: 'Rojas Nerina', obra_social: 'omint' },

  // Lunes 4 de Mayo
  { fecha: '2026-05-04', hora: '11:00', paciente: 'Lopez Natta Macarena' },
  { fecha: '2026-05-04', hora: '14:00', paciente: 'Ibañez Javier Eugenio' },
  { fecha: '2026-05-04', hora: '15:00', paciente: 'Martinez Damian Alejandro' },
  { fecha: '2026-05-04', hora: '17:30', paciente: 'Thornton Nazarena' },
  { fecha: '2026-05-04', hora: '18:30', paciente: 'CORREA WALTER JOSE' },

  // Martes 5 de Mayo
  { fecha: '2026-05-05', hora: '18:00', paciente: 'ROMAN AGUSTINA', obra_social: 'san' }
];

const OBRA_SOCIAL_MAPPING = {
  'ioma': 1,
  'part': 4,
  'san': 10,
  'omint': 43
};

function splitName(fullName) {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return { nombre: parts[0], apellido: 'S/A' };
  
  // Asumimos que la primera palabra es el apellido si está en mayúsculas, o simplemente partimos a la mitad
  // Pero en dental es común "APELLIDO NOMBRE"
  // Para la migración, pondremos el resto en nombre
  const apellido = parts[0];
  const nombre = parts.slice(1).join(' ');
  return { nombre: nombre || apellido, apellido };
}

function generateDummyDNI(name) {
  // Generar un número alto basado en el nombre para evitar colisiones
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return '99' + Math.abs(hash).toString().substring(0, 6);
}

async function migrate() {
  console.log('Iniciando migración de turnos para Thomas Garrido...');
  
  const t = await sequelize.transaction();
  
  try {
    const prof = await Profesional.findByPk(PROFESIONAL_ID);
    const serv = await Servicio.findByPk(SERVICIO_ID);
    
    if (!prof || !serv) {
      throw new Error('Profesional o Servicio no encontrado');
    }

    let createdCount = 0;
    
    for (const data of APPOINTMENTS_DATA) {
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
        const obra_social_id = OBRA_SOCIAL_MAPPING[data.obra_social] || 4; // Default Particular
        
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
    await t.rollback();
    console.error('Error durante la migración:', error);
  } finally {
    process.exit();
  }
}

migrate();
