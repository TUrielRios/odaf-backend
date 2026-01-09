const { MovimientoCuenta, Paciente, ObraSocial } = require("../models")
const { validationResult } = require("express-validator")

const obtenerMovimientos = async (req, res) => {
    try {
        const { pacienteId } = req.params
        const movimientos = await MovimientoCuenta.findAll({
            where: { paciente_id: pacienteId },
            order: [["fecha", "DESC"], ["createdAt", "DESC"]],
        })

        // Calculate totals
        let ingresos = 0
        let deudas = 0
        movimientos.forEach(m => {
            const monto = parseFloat(m.monto)
            if (m.tipo === 'Ingreso') ingresos += monto
            else if (m.tipo === 'Deuda') deudas += monto
        })

        res.json({
            movimientos,
            resumen: {
                ingresos,
                deudas,
                saldo: ingresos - deudas // Positive means credit, negative means debt
            }
        })
    } catch (error) {
        console.error("Error al obtener movimientos:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
}

const registrarMovimiento = async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        // pacienteId can be in params (patient view) or body (cash flow view)
        const pacienteId = req.params.pacienteId || req.body.pacienteId || null
        const { fecha, tipo, monto, forma_pago, descripcion } = req.body

        const movimiento = await MovimientoCuenta.create({
            paciente_id: pacienteId,
            fecha,
            tipo,
            monto,
            forma_pago: (tipo === 'Ingreso' || tipo === 'Egreso') ? forma_pago : null,
            descripcion
        })

        res.status(201).json(movimiento)
    } catch (error) {
        console.error("Error al registrar movimiento:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
}

const obtenerFlujoCaja = async (req, res) => {
    try {
        const movimientos = await MovimientoCuenta.findAll({
            include: [{
                model: Paciente,
                as: "paciente",
                attributes: ["id", "nombre", "apellido"],
                include: [{
                    model: ObraSocial,
                    as: "obraSocial",
                    attributes: ["nombre"]
                }]
            }],
            order: [["fecha", "DESC"], ["createdAt", "DESC"]]
        })

        let balance = 0
        const movimientosFormatted = movimientos.map(m => {
            const monto = parseFloat(m.monto)
            if (m.tipo === 'Ingreso') balance += monto
            else if (m.tipo === 'Egreso') balance -= monto
            // Deuda doesn't affect cash flow balance, only patient balance. 
            // BUT user requirement says "Balance ARS" in the screenshot. 
            // Usually Cash Flow = In - Out. Debt is not cash out yet.
            // However, if "Deuda" means "Expense" in their terminology... 
            // The user said "registrar un ingreso y un egreso o extraccion o deuda".
            // In the screenshot, "Total Deudas" is red. "Saldo Actual" is negative.
            // In "Flujo de Caja", "Balance" is green.
            // Let's assume Cash Flow Balance = Ingresos - Egresos. 
            // "Deuda" (Patient Debt) is NOT a cash outflow. It's an account receivable.
            // "Egreso" is a cash outflow (expense).

            return {
                ...m.toJSON(),
                pacienteNombre: m.paciente ? `${m.paciente.nombre} ${m.paciente.apellido}` : null,
                obraSocial: m.paciente?.obraSocial?.nombre || null
            }
        })

        res.json({
            movimientos: movimientosFormatted,
            balance
        })
    } catch (error) {
        console.error("Error al obtener flujo de caja:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
}

const obtenerDeudores = async (req, res) => {
    try {
        // Fetch all movements with patient info
        const movimientos = await MovimientoCuenta.findAll({
            include: [{
                model: Paciente,
                as: "paciente",
                attributes: ["id", "nombre", "apellido"],
                include: [{
                    model: ObraSocial,
                    as: "obraSocial",
                    attributes: ["nombre"]
                }]
            }],
            order: [["fecha", "ASC"]]
        })

        // Group by patient and calculate balance
        const balancePorPaciente = {}

        movimientos.forEach(m => {
            // Skip movements without patient (general cash flow entries)
            if (!m.paciente || !m.paciente_id) {
                return;
            }

            if (!balancePorPaciente[m.paciente_id]) {
                const obraSocialNombre = m.paciente?.obraSocial?.nombre || "PARTICULAR"
                balancePorPaciente[m.paciente_id] = {
                    paciente: {
                        id: m.paciente.id,
                        nombre: m.paciente.nombre,
                        apellido: m.paciente.apellido,
                        obra_social: obraSocialNombre
                    },
                    balance: 0,
                    primerDeuda: null
                }
            }

            const monto = parseFloat(m.monto)
            if (m.tipo === 'Ingreso') {
                balancePorPaciente[m.paciente_id].balance += monto
            } else if (m.tipo === 'Deuda') {
                balancePorPaciente[m.paciente_id].balance -= monto
                // Track first debt date if balance becomes negative
                if (balancePorPaciente[m.paciente_id].balance < 0 && !balancePorPaciente[m.paciente_id].primerDeuda) {
                    balancePorPaciente[m.paciente_id].primerDeuda = m.fecha
                }
                // Reset first debt date if balance becomes positive
                if (balancePorPaciente[m.paciente_id].balance >= 0) {
                    balancePorPaciente[m.paciente_id].primerDeuda = null
                }
            }
        })

        // Filter debtors (negative balance)
        const deudores = Object.values(balancePorPaciente)
            .filter(item => item.balance < -0.01) // Use small epsilon for float comparison
            .map(item => ({
                paciente: item.paciente,
                deudaTotal: item.balance,
                fechaDesde: item.primerDeuda || new Date().toISOString().split('T')[0] // Fallback if logic missed it
            }))

        res.json(deudores)
    } catch (error) {
        console.error("Error al obtener deudores:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
}

const eliminarMovimiento = async (req, res) => {
    try {
        const { id } = req.params
        const movimiento = await MovimientoCuenta.findByPk(id)

        if (!movimiento) {
            return res.status(404).json({ error: "Movimiento no encontrado" })
        }

        await movimiento.destroy()
        res.json({ message: "Movimiento eliminado correctamente" })
    } catch (error) {
        console.error("Error al eliminar movimiento:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
}

module.exports = {
    obtenerMovimientos,
    registrarMovimiento,
    eliminarMovimiento,
    obtenerDeudores,
    obtenerFlujoCaja
}
