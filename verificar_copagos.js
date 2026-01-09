require("dotenv").config()
const { sequelize, Copago, ObraSocial, Servicio } = require("./src/models")

async function verificar() {
    try {
        await sequelize.authenticate()

        // Verificar IOMA
        const ioma = await ObraSocial.findOne({ where: { nombre: "Ioma" } })
        if (ioma) {
            const copagoIoma = await Copago.findAll({
                where: { obra_social_id: ioma.id },
                include: [
                    { model: Servicio, as: "servicio", attributes: ["nombre"] }
                ]
            })
            console.log("\n=== IOMA ===")
            copagoIoma.forEach(c => {
                console.log(`${c.servicio.nombre}: $${c.monto}`)
            })
        }

        // Verificar PRIVAMED 100
        const privamed100 = await ObraSocial.findOne({ where: { nombre: "Privamed 100" } })
        if (privamed100) {
            const copagoPM = await Copago.findAll({
                where: { obra_social_id: privamed100.id },
                include: [
                    { model: Servicio, as: "servicio", attributes: ["nombre"] }
                ]
            })
            console.log("\n=== PRIVAMED 100 ===")
            copagoPM.forEach(c => {
                console.log(`${c.servicio.nombre}: $${c.monto}`)
            })
        }

        // Verificar PRIVAMED 770
        const privamed770 = await ObraSocial.findOne({ where: { nombre: "Privamed 770" } })
        if (privamed770) {
            const copagoPM770 = await Copago.findAll({
                where: { obra_social_id: privamed770.id },
                include: [
                    { model: Servicio, as: "servicio", attributes: ["nombre"] }
                ]
            })
            console.log("\n=== PRIVAMED 770 (debería ser $0) ===")
            copagoPM770.forEach(c => {
                console.log(`${c.servicio.nombre}: $${c.monto}`)
            })
        }

        // Listar algunos de los consulmed
        const visitar = await ObraSocial.findOne({ where: { nombre: "Visitar Consulmed" } })
        if (visitar) {
            const copagoVisitar = await Copago.findAll({
                where: { obra_social_id: visitar.id },
                include: [
                    { model: Servicio, as: "servicio", attributes: ["nombre"] }
                ]
            })
            console.log("\n=== VISITAR CONSULMED (debería ser $14.500) ===")
            copagoVisitar.forEach(c => {
                console.log(`${c.servicio.nombre}: $${c.monto}`)
            })
        }

        await sequelize.close()
    } catch (error) {
        console.error("Error:", error.message)
    }
}

verificar()
