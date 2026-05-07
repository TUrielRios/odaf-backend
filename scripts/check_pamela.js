require('dotenv').config({ path: './backend/.env' });
const { Paciente, Turno } = require('../src/models');
const { Op, Sequelize } = require('sequelize');

(async () => {
    try {
        // 1. Find ALL remaining duplicates (same name+surname normalized)
        const pacientes = await Paciente.findAll({ raw: true });
        console.log(`Total pacientes: ${pacientes.length}`);
        
        const normalize = (str) => str ? str.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ]/g, '').toLowerCase() : '';
        
        const grouped = {};
        pacientes.forEach(p => {
            const key = [normalize(p.nombre), normalize(p.apellido)].sort().join('|');
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(p);
        });

        const duplicates = Object.entries(grouped).filter(([k, v]) => v.length > 1);
        console.log(`\nGrupos con duplicados: ${duplicates.length}`);
        
        // Show first 20 duplicate groups
        for (const [key, group] of duplicates.slice(0, 20)) {
            console.log(`\n--- Key: ${key} (${group.length} registros) ---`);
            for (const p of group) {
                const turnoCount = await Turno.count({ where: { paciente_id: p.id } });
                console.log(`  ID: ${p.id} | "${p.nombre}" "${p.apellido}" | DNI: ${p.numero_documento} | Turnos: ${turnoCount}`);
            }
        }

        // Also specifically search for "gonzalez" with "samanta"
        console.log('\n\n=== Buscando Samanta Gonzalez específicamente ===');
        const samanta = await Paciente.findAll({
            where: {
                [Op.or]: [
                    { nombre: { [Op.iLike]: '%samanta%' }, apellido: { [Op.iLike]: '%gonzalez%' } },
                    { nombre: { [Op.iLike]: '%gonzalez%' }, apellido: { [Op.iLike]: '%samanta%' } }
                ]
            },
            raw: true
        });
        for (const p of samanta) {
            const turnoCount = await Turno.count({ where: { paciente_id: p.id } });
            console.log(`  ID: ${p.id} | "${p.nombre}" "${p.apellido}" | DNI: ${p.numero_documento} | Turnos: ${turnoCount}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();
