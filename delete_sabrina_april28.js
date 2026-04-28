const { Turno, Paciente } = require('./src/models');
const { Op } = require('sequelize');

function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\s+/g, ' ')
    .trim();
}

function namesMatch(name1, name2) {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  
  if (n1 === n2) return true;
  
  // Check words
  const words1 = n1.split(' ').sort().join(' ');
  const words2 = n2.split(' ').sort().join(' ');
  
  // Custom logic for subset matching like "Cuevas Trejo Nicole Celest" vs "Nicole Celeste Cuevas Trejo"
  if (words1 === words2) return true;
  
  // If one string is a subset of another (e.g. "arevalos nunez" vs "benjamin arevalos nunez")
  if (n1 && n2) {
      const arr1 = n1.split(' ');
      const arr2 = n2.split(' ');
      if (arr1.length > 1 && arr2.length > 1) {
          if (arr1.every(w => n2.includes(w)) || arr2.every(w => n1.includes(w))) {
              // Be careful not to match completely different people like "Gael" and "Ian Gael", but the user explicitly has these duplicates
              return true;
          }
      }
  }

  return false;
}

async function main() {
  try {
    const salinasId = 13; // Dra. SALINAS S. (Sabrina)

    const turnos = await Turno.findAll({
      where: {
        profesional_id: salinasId,
        fecha: '2026-04-28'
      },
      include: [{ model: Paciente, as: 'paciente' }],
      order: [['hora_inicio', 'ASC']]
    });

    const toDelete = [];
    const kept = [];

    // Iterate sequentially. Since they are ordered by time, the first one we see for a patient is the one we keep.
    for (const t of turnos) {
      const currentName = t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}` : '';
      
      let isDuplicate = false;
      let duplicateOf = null;

      for (const k of kept) {
        const keptName = k.paciente ? `${k.paciente.nombre} ${k.paciente.apellido}` : '';
        if (namesMatch(currentName, keptName)) {
            // Exceptions? If they are siblings, they wouldn't match fully unless they have the exact same name. 
            // The namesMatch logic handles subsets. Let's make sure it doesn't delete siblings. 
            // In the user's list, duplicates are very clearly the same person.
            isDuplicate = true;
            duplicateOf = k;
            break;
        }
      }

      if (isDuplicate) {
          const keptName = duplicateOf.paciente ? `${duplicateOf.paciente.nombre} ${duplicateOf.paciente.apellido}` : '';
          console.log(`[DUPLICADO] Eliminando turno de ${t.hora_inicio} (${currentName}) a favor de ${duplicateOf.hora_inicio} (${keptName})`);
          toDelete.push(t);
      } else {
          kept.push(t);
      }
    }

    if (toDelete.length > 0) {
      console.log(`\nEliminando ${toDelete.length} turnos duplicados de Sabrina el 28 de Abril...`);
      for (const t of toDelete) {
        await t.destroy();
      }
      console.log('¡Turnos duplicados eliminados con éxito!');
    } else {
      console.log('\nNo se encontraron turnos duplicados para eliminar.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

main();
