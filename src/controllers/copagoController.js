const { Copago, Servicio, ObraSocial } = require("../models")

const obtenerCopago = async (req, res) => {
    try {
        const { servicio_id, obra_social_id } = req.query

        if (!servicio_id || !obra_social_id) {
            return res.status(400).json({
                error: "Faltan parámetros requeridos: servicio_id, obra_social_id",
            })
        }

        const copago = await Copago.findOne({
            where: {
                servicio_id,
                obra_social_id,
            },
            include: [
                {
                    model: Servicio,
                    as: "servicio",
                    attributes: ["nombre"],
                },
                {
                    model: ObraSocial,
                    as: "obraSocial",
                    attributes: ["nombre"],
                },
            ],
        })

        if (!copago) {
            // Si no hay copago específico, devolvemos 0 o un mensaje indicando que no aplica
            return res.json({ monto: 0, mensaje: "No se encontró configuración de copago" })
        }

        res.json(copago)
    } catch (error) {
        console.error("Error al obtener copago:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
}

module.exports = {
    obtenerCopago,
}
