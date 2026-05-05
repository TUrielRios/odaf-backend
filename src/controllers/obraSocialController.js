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

const crearObraSocial = async (req, res) => {
    try {
        const { nombre, plan, numero_afiliado } = req.body

        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: "El nombre es requerido" })
        }

        const obraSocial = await ObraSocial.create({
            nombre: nombre.trim(),
            plan: plan || null,
            numero_afiliado: numero_afiliado || null,
        })

        res.status(201).json(obraSocial)
    } catch (error) {
        console.error("Error al crear obra social:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
}

const actualizarObraSocial = async (req, res) => {
    try {
        const { id } = req.params
        const { nombre, plan, numero_afiliado } = req.body

        const obraSocial = await ObraSocial.findByPk(id)
        if (!obraSocial) {
            return res.status(404).json({ error: "Obra social no encontrada" })
        }

        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: "El nombre es requerido" })
        }

        await obraSocial.update({
            nombre: nombre.trim(),
            plan: plan !== undefined ? plan : obraSocial.plan,
            numero_afiliado: numero_afiliado !== undefined ? numero_afiliado : obraSocial.numero_afiliado,
        })

        res.json(obraSocial)
    } catch (error) {
        console.error("Error al actualizar obra social:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
}

const eliminarObraSocial = async (req, res) => {
    try {
        const { id } = req.params

        const obraSocial = await ObraSocial.findByPk(id)
        if (!obraSocial) {
            return res.status(404).json({ error: "Obra social no encontrada" })
        }

        await obraSocial.destroy()
        res.json({ message: "Obra social eliminada correctamente" })
    } catch (error) {
        console.error("Error al eliminar obra social:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
}

module.exports = {
    listarObrasSociales,
    crearObraSocial,
    actualizarObraSocial,
    eliminarObraSocial,
}
