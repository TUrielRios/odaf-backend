const { Servicio, Profesional, sequelize } = require("../src/models");

async function verify() {
    try {
        const servicio = await Servicio.findOne({
            where: { nombre: "Endodoncia" },
            include: [
                {
                    model: Profesional,
                    as: "profesionales",
                    through: {
                        attributes: ["estado", "createdAt"],
                        where: { estado: "Activo" },
                    },
                    attributes: ["id", "nombre", "apellido", "especialidad", "telefono", "email", "estado"],
                },
            ],
        });

        if (servicio && servicio.profesionales.length > 0) {
            console.log("Profesional found:", servicio.profesionales[0].apellido);
            console.log("Estado:", servicio.profesionales[0].estado);
        } else {
            console.log("No professionals found for Endodoncia.");
        }

    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
}

verify();
