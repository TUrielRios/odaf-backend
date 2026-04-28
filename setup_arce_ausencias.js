const { Ausencia } = require('./src/models');

async function main() {
  try {
    const arceId = 18; // DRA. ARCE F.
    
    console.log(`Configurando primera semana no laborable para la Dra. Arce F. (ID: ${arceId})...`);

    await Ausencia.sync({ alter: true });

    // Crear ausencias para la primera semana de cada mes desde Mayo 2026 hasta Diciembre 2027
    const ausencias = [];
    
    for (let year = 2026; year <= 2027; year++) {
      const startMonth = year === 2026 ? 5 : 1; // Start from May 2026
      
      for (let month = startMonth; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, '0');
        const fecha_inicio = `${year}-${monthStr}-01`;
        const fecha_fin = `${year}-${monthStr}-07`;
        
        ausencias.push({
          profesional_id: arceId,
          fecha_inicio,
          fecha_fin,
          motivo: 'Primera semana del mes'
        });
      }
    }

    for (const data of ausencias) {
      await Ausencia.findOrCreate({
        where: {
          profesional_id: data.profesional_id,
          fecha_inicio: data.fecha_inicio,
          fecha_fin: data.fecha_fin
        },
        defaults: data
      });
      console.log(`- Bloqueado del ${data.fecha_inicio} al ${data.fecha_fin}`);
    }

    console.log('¡Ausencias configuradas exitosamente!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

main();
