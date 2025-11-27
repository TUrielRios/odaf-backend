const { ObraSocial } = require("../models")

const listarObrasSociales = async (req, res) => {
    try {
        const obrasSociales = await ObraSocial.findAll({
            order: [["nombre", "ASC"]],
        })
        res.json(obrasSociales)
    } catch (error) {
        console.error("Error al listar obras sociales:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
}

module.exports = {
    listarObrasSociales,
}
