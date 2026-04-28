const { Turno, Paciente } = require('./src/models');
const { Op } = require('sequelize');

function normalizeName(name) {
  return name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\s+/g, ' ')
    .trim();
}

// Some names might be backwards like "Arce Bautista Gael" vs "Bautista Gael Arce"
function namesMatch(name1, name2) {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  
  if (n1 === n2) return true;
  
  // Check if they are the same words in different order
  const words1 = n1.split(' ').sort().join(' ');
  const words2 = n2.split(' ').sort().join(' ');
  return words1 === words2;
}

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

    // Group by fecha + hora_inicio
    const groups = {};
    turnos.forEach(t => {
      const key = `${t.fecha}_${t.hora_inicio}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    const turnosToDelete = [];

    for (const key in groups) {
      const group = groups[key];
      if (group.length > 1) {
        // Find exact duplicates within this group
        // We compare each pair
        const toKeep = new Set();
        const toDeleteThisGroup = new Set();

        for (let i = 0; i < group.length; i++) {
          if (toDeleteThisGroup.has(group[i].id)) continue;

          toKeep.add(group[i].id);
          const name1 = group[i].paciente ? `${group[i].paciente.nombre} ${group[i].paciente.apellido}` : '';

          for (let j = i + 1; j < group.length; j++) {
            if (toDeleteThisGroup.has(group[j].id)) continue;
            
            const name2 = group[j].paciente ? `${group[j].paciente.nombre} ${group[j].paciente.apellido}` : '';
            
            if (namesMatch(name1, name2)) {
              toDeleteThisGroup.add(group[j].id);
              turnosToDelete.push(group[j]);
              console.log(`[DUPLICADO ENCONTRADO] Se eliminará Turno ID ${group[j].id} (${name2}) a favor de ID ${group[i].id} (${name1}) en ${key}`);
            }
          }
        }
      }
    }

    if (turnosToDelete.length > 0) {
      console.log(`\nEliminando ${turnosToDelete.length} turnos duplicados...`);
      for (const t of turnosToDelete) {
        await t.destroy();
      }
      console.log('¡Turnos duplicados eliminados con éxito!');
    } else {
      console.log('\nNo se encontraron turnos duplicados exactos para eliminar.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

main();
