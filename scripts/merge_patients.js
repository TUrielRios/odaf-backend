require('dotenv').config({ path: './backend/.env' });
const { 
    sequelize, 
    Paciente, 
    Turno, 
    HistorialClinico, 
    Odontograma, 
    Prescripcion, 
    PlanTratamiento, 
    Archivo, 
    MovimientoCuenta, 
    UsuarioPaciente,
    Prestacion
} = require('../src/models');
const { Op } = require('sequelize');

async function mergePatients() {
    try {
        console.log('=== Unificación de pacientes duplicados (v3 - palabras globales) ===\n');
        
        const pacientes = await Paciente.findAll();
        const pacientesData = pacientes.map(p => p.get({ plain: true }));
        console.log(`Total pacientes: ${pacientesData.length}\n`);

        // KEY INSIGHT: Combine ALL words from nombre+apellido, sort them, 
        // so "Pamela" + "Samanta Gonzalez" matches "GONZALEZ" + "PAMELA SAMANTA"
        const normalize = (str) => {
            if (!str) return '';
            return str
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
                .replace(/[^a-zA-Z0-9\s]/g, '') // remove punctuation
                .toLowerCase()
                .trim();
        };

        const getKey = (nombre, apellido) => {
            const allWords = `${normalize(nombre)} ${normalize(apellido)}`
                .split(/\s+/)
                .filter(w => w.length > 0)
                .sort()
                .join('');
            return allWords;
        };

        // Create a map from ID to model instance for later use
        const modelMap = {};
        pacientes.forEach(p => { modelMap[p.id] = p; });

        const grouped = {};
        pacientesData.forEach(p => {
            const key = getKey(p.nombre, p.apellido);
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(p);
        });

        const duplicateGroups = Object.entries(grouped).filter(([k, v]) => v.length > 1);
        console.log(`Grupos con duplicados encontrados: ${duplicateGroups.length}\n`);

        let mergedCount = 0;

        for (const [key, group] of duplicateGroups) {
            console.log(`\n--- Grupo "${key}" (${group.length} registros) ---`);
            
            // Pick primary: prefer UPPERCASE, then most data (phone, email)
            let primary = group.find(p => 
                p.nombre === p.nombre.toUpperCase() && p.apellido === p.apellido.toUpperCase()
            );
            if (!primary) {
                // Pick the one with the most contact info
                primary = group.reduce((best, p) => {
                    const score = (p.telefono ? 1 : 0) + (p.email ? 1 : 0) + (p.direccion ? 1 : 0);
                    const bestScore = (best.telefono ? 1 : 0) + (best.email ? 1 : 0) + (best.direccion ? 1 : 0);
                    return score > bestScore ? p : best;
                }, group[0]);
            }

            const duplicates = group.filter(p => p.id !== primary.id);
            
            console.log(`  PRIMARY: "${primary.nombre}" "${primary.apellido}" [DNI: ${primary.numero_documento}] (ID: ${primary.id})`);

            for (const dupe of duplicates) {
                console.log(`  MERGE <- "${dupe.nombre}" "${dupe.apellido}" [DNI: ${dupe.numero_documento}] (ID: ${dupe.id})`);
                
                const t = await sequelize.transaction();
                try {
                    // Move ALL relations
                    const [turnosN] = await Turno.update({ paciente_id: primary.id }, { where: { paciente_id: dupe.id }, transaction: t });
                    const [histN] = await HistorialClinico.update({ paciente_id: primary.id }, { where: { paciente_id: dupe.id }, transaction: t });
                    const [odonN] = await Odontograma.update({ paciente_id: primary.id }, { where: { paciente_id: dupe.id }, transaction: t });
                    const [prescN] = await Prescripcion.update({ paciente_id: primary.id }, { where: { paciente_id: dupe.id }, transaction: t });
                    const [planN] = await PlanTratamiento.update({ paciente_id: primary.id }, { where: { paciente_id: dupe.id }, transaction: t });
                    const [archN] = await Archivo.update({ paciente_id: primary.id }, { where: { paciente_id: dupe.id }, transaction: t });
                    const [movN] = await MovimientoCuenta.update({ paciente_id: primary.id }, { where: { paciente_id: dupe.id }, transaction: t });
                    const [prestN] = await Prestacion.update({ paciente_id: primary.id }, { where: { paciente_id: dupe.id }, transaction: t });

                    // UsuarioPaciente
                    const dupeUser = await UsuarioPaciente.findOne({ where: { paciente_id: dupe.id }, transaction: t });
                    if (dupeUser) {
                        const primaryUser = await UsuarioPaciente.findOne({ where: { paciente_id: primary.id }, transaction: t });
                        if (!primaryUser) {
                            await dupeUser.update({ paciente_id: primary.id }, { transaction: t });
                        } else {
                            await dupeUser.destroy({ transaction: t });
                        }
                    }

                    // Delete duplicate using the model instance
                    await modelMap[dupe.id].destroy({ transaction: t });
                    await t.commit();
                    
                    console.log(`    ✓ Movidos: ${turnosN} turnos, ${histN} historiales, ${odonN} odontogramas, ${prestN} prestaciones`);
                    mergedCount++;
                } catch (err) {
                    await t.rollback();
                    console.error(`    ✗ ERROR: ${err.message}`);
                }
            }
        }

        // Verify Pamela specifically
        console.log('\n\n=== Verificación post-merge: Pamela Samanta Gonzalez ===');
        const pamelas = await Paciente.findAll({
            where: {
                [Op.or]: [
                    { nombre: { [Op.iLike]: '%pamela%samanta%' } },
                    { apellido: { [Op.iLike]: '%samanta%gonzalez%' } },
                    { nombre: { [Op.iLike]: '%samanta%' }, apellido: { [Op.iLike]: '%gonzalez%' } }
                ]
            },
            raw: true
        });
        for (const p of pamelas) {
            const turnoCount = await Turno.count({ where: { paciente_id: p.id } });
            console.log(`  "${p.nombre}" "${p.apellido}" DNI:${p.numero_documento} -> ${turnoCount} turnos`);
        }

        console.log(`\n=== Proceso finalizado. ${mergedCount} duplicados eliminados. ===`);
        process.exit(0);
    } catch (error) {
        console.error('Error general:', error);
        process.exit(1);
    }
}

mergePatients();
