const { Profesional, Servicio, ProfesionalServicio, sequelize } = require("../src/models");

async function inspect() {
    try {
        const profesional = await Profesional.findOne({
            where: { apellido: "Aguilera" }
        });
        console.log("Profesional:", JSON.stringify(profesional, null, 2));

        const servicio = await Servicio.findOne({
            where: { nombre: "Endodoncia" }
        });
        console.log("Servicio:", JSON.stringify(servicio, null, 2));

        if (profesional && servicio) {
            const relacion = await ProfesionalServicio.findOne({
                where: {
                    profesional_id: profesional.id,
                    servicio_id: servicio.id
                }
            });
            console.log("Relacion:", JSON.stringify(relacion, null, 2));
        }

    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
}

inspect();
