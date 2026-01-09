const db = require('../src/models');

async function debugDeudores() {
    try {
        console.log("Fetching movements...");
        const movimientos = await db.MovimientoCuenta.findAll({
            include: [{
                model: db.Paciente,
                as: "paciente",
                attributes: ["id", "nombre", "apellido"],
                include: [{
                    model: db.ObraSocial,
                    as: "obraSocial",
                    attributes: ["nombre"]
                }]
            }],
            order: [["fecha", "ASC"]]
        });

        console.log(`Found ${movimientos.length} movements.`);

        const balancePorPaciente = {};

        movimientos.forEach(m => {
            console.log(`Processing movement: ID ${m.id}, Patient ${m.paciente_id}, Type ${m.tipo}, Amount ${m.monto}`);

            if (!balancePorPaciente[m.paciente_id]) {
                const obraSocialNombre = m.paciente?.obraSocial?.nombre || "PARTICULAR";
                balancePorPaciente[m.paciente_id] = {
                    paciente: {
                        id: m.paciente.id,
                        nombre: m.paciente.nombre,
                        apellido: m.paciente.apellido,
                        obra_social: obraSocialNombre
                    },
                    balance: 0,
                    primerDeuda: null
                };
            }

            const monto = parseFloat(m.monto);
            if (m.tipo === 'Ingreso') {
                balancePorPaciente[m.paciente_id].balance += monto;
            } else if (m.tipo === 'Deuda') {
                balancePorPaciente[m.paciente_id].balance -= monto;

                if (balancePorPaciente[m.paciente_id].balance < 0 && !balancePorPaciente[m.paciente_id].primerDeuda) {
                    balancePorPaciente[m.paciente_id].primerDeuda = m.fecha;
                }
                if (balancePorPaciente[m.paciente_id].balance >= 0) {
                    balancePorPaciente[m.paciente_id].primerDeuda = null;
                }
            }
            console.log(`  Current Balance for ${m.paciente_id}: ${balancePorPaciente[m.paciente_id].balance}`);
        });

        const deudores = Object.values(balancePorPaciente)
            .filter(item => item.balance < -0.01)
            .map(item => ({
                paciente: item.paciente ? `${item.paciente.nombre} ${item.paciente.apellido}` : 'Unknown',
                deudaTotal: item.balance,
                fechaDesde: item.primerDeuda
            }));

        console.log("Deudores found:", JSON.stringify(deudores, null, 2));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        // await db.sequelize.close(); // Keep connection open if needed or close it
    }
}

debugDeudores();
