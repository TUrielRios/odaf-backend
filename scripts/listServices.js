const { Servicio, sequelize } = require("../src/models");

async function list() {
    try {
        const servicios = await Servicio.findAll({ attributes: ['id', 'nombre'] });
        console.log(JSON.stringify(servicios, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
}

list();
