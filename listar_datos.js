require("dotenv").config()
const { sequelize, ObraSocial, Servicio } = require("./src/models")

async function listar() {
    try {
        await sequelize.authenticate()

        const obrasSociales = await ObraSocial.findAll({
            order: [['nombre', 'ASC']]
        })

        const servicios = await Servicio.findAll({
            order: [['nombre', 'ASC']]
        })

        console.log("\n=== OBRAS SOCIALES ===")
        obrasSociales.forEach(os => {
            console.log(`${os.id}\t${os.nombre}`)
        })

        console.log("\n=== SERVICIOS ===")
        servicios.forEach(s => {
            console.log(`${s.id}\t${s.nombre}`)
        })

        await sequelize.close()
    } catch (error) {
        console.error("Error:", error.message)
        process.exit(1)
    }
}

listar()
