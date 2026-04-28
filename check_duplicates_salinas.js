const { Turno, Paciente, Profesional } = require('./src/models');
const { Op } = require('sequelize');

async function main() {
  try {
    const salinasId = 13; // Dra. SALINAS S.

    const turnos = await Turno.findAll({
      where: {
        profesional_id: salinasId,
        fecha: {
          [Op.between]: ['2026-05-01', '2026-05-31']
        }
      },
      include: [{ model: Paciente, as: 'paciente' }],
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']]
    });

    console.log(`\nTurnos encontrados para Dra. Salinas (ID 13) en mayo 2026: ${turnos.length}`);

    // Track seen combinations to find duplicates
    const seen = new Map();
    const duplicates = [];

    turnos.forEach(t => {
      const pacienteNombre = t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}` : 'Sin paciente / Bloqueo';
      const key = `${t.fecha}_${t.hora_inicio}`;

      if (seen.has(key)) {
        duplicates.push({
          paciente1: seen.get(key).pacienteNombre,
          paciente2: pacienteNombre,
          fecha: t.fecha,
          hora: t.hora_inicio,
          id1: seen.get(key).id,
          id2: t.id
        });
      } else {
        seen.set(key, { id: t.id, pacienteNombre });
      }
    });

    if (duplicates.length > 0) {
      console.log(`\nSE ENCONTRARON ${duplicates.length} HORARIOS SUPERPUESTOS (Mismo día y misma hora):`);
      duplicates.forEach(d => {
        console.log(`- ${d.fecha} a las ${d.hora}:`);
        console.log(`  -> Turno A (ID ${d.id1}): ${d.paciente1}`);
        console.log(`  -> Turno B (ID ${d.id2}): ${d.paciente2}`);
      });
    } else {
      console.log('\nNo se encontraron horarios superpuestos.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

main();
