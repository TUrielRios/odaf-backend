const { Profesional, Servicio, ProfesionalServicio, sequelize } = require("../src/models");

const servicesToCreate = [
    { nombre: "Cirugía", categoria: "Cirugía", precio_base: 0, duracion_estimada: 60, estado: "Activo" },
    { nombre: "Implantes", categoria: "Implantes", precio_base: 0, duracion_estimada: 60, estado: "Activo" },
    { nombre: "Odontología general", categoria: "General", precio_base: 0, duracion_estimada: 30, estado: "Activo" },
    { nombre: "Endodoncia", categoria: "Endodoncia", precio_base: 0, duracion_estimada: 60, estado: "Activo" },
];

const professionalServiceMapping = [
    {
        professionalName: "Franzil", // Lastname
        services: ["Ortopedia de los maxilares"]
    },
    {
        professionalName: "Garrido",
        services: ["Cirugía", "Implantes"]
    },
    {
        professionalName: "Garofolo",
        services: ["Odontología general"]
    },
    {
        professionalName: "Aguilera",
        services: ["Endodoncia", "Odontología general"]
    },
    {
        professionalName: "Arce",
        services: ["Odontopediatría"]
    },
    {
        professionalName: "Vago",
        services: ["Odontopediatría"]
    },
    {
        professionalName: "Sánchez",
        services: ["Ortodoncia"]
    }
];

async function seed() {
    try {
        console.log("Iniciando vinculación de servicios y profesionales...");

        // 1. Create missing services
        for (const serviceData of servicesToCreate) {
            const [service, created] = await Servicio.findOrCreate({
                where: { nombre: serviceData.nombre },
                defaults: serviceData
            });
            if (created) console.log(`Servicio creado: ${service.nombre}`);
            else console.log(`Servicio ya existe: ${service.nombre}`);
        }

        // 2. Link professionals
        for (const mapping of professionalServiceMapping) {
            const professional = await Profesional.findOne({
                where: { apellido: mapping.professionalName }
            });

            if (!professional) {
                console.warn(`Profesional no encontrado: ${mapping.professionalName}`);
                continue;
            }

            for (const serviceName of mapping.services) {
                const service = await Servicio.findOne({
                    where: { nombre: serviceName }
                });

                if (!service) {
                    console.warn(`Servicio no encontrado: ${serviceName}`);
                    continue;
                }

                const [relation, created] = await ProfesionalServicio.findOrCreate({
                    where: {
                        profesional_id: professional.id,
                        servicio_id: service.id
                    },
                    defaults: { estado: "Activo" }
                });

                if (created) console.log(`Asignado ${service.nombre} a ${professional.apellido}`);
                else console.log(`${service.nombre} ya asignado a ${professional.apellido}`);
            }
        }

        console.log("Vinculación finalizada.");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit(0);
    }
}

seed();
