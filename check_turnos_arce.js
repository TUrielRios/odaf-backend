const { Turno, Profesional, Paciente, ObraSocial } = require('./src/models');
const { Op } = require('sequelize');

async function main() {
  try {
    const profesionales = await Profesional.findAll();
    console.log('Todos los profesionales:');
    profesionales.forEach(p => console.log(`${p.id} - ${p.nombre} ${p.apellido}`));

    const profesional = profesionales.find(p => p.id === 18);

    if (!profesional) {
      console.log('No se encontró a la profesional ARCE.');
      process.exit();
    }

    console.log(`\nBuscando turnos para Profesional encontrada: ${profesional.nombre} ${profesional.apellido} (ID: ${profesional.id})`);

    const turnos = await Turno.findAll({
      where: {
        profesional_id: profesional.id,
        fecha: {
          [Op.between]: ['2026-04-29', '2026-04-30']
        }
      },
      include: [
        { model: Paciente, as: 'paciente', include: [{ model: ObraSocial, as: 'obraSocial' }] }
      ],
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']]
    });

    console.log(`\nTurnos encontrados para el 29 y 30 de abril de 2026: ${turnos.length}`);
    let currentDate = '';
    turnos.forEach(t => {
      if (t.fecha !== currentDate) {
        console.log(`\n--- Fecha: ${t.fecha} ---`);
        currentDate = t.fecha;
      }
      const pacienteNombre = t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}` : 'Sin paciente (Bloqueo/Otro)';
      const os = t.paciente && t.paciente.obraSocial ? t.paciente.obraSocial.nombre : 'Particular/Sin OS';
      console.log(`[${t.hora_inicio}] ${pacienteNombre} - OS: ${os} - Estado: ${t.estado}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

main();
