const { Profesional, sequelize } = require("../src/models");

const profesionalesData = [
    {
        nombre: "Adriana",
        apellido: "Franzil",
        especialidad: "Ortopedia",
        horarios_atencion: {
            lunes: { activo: false, rangos: [] },
            martes: { activo: false, rangos: [] },
            miercoles: { activo: false, rangos: [] },
            jueves: {
                activo: true,
                rangos: [
                    { inicio: "09:00", fin: "12:00" },
                    { inicio: "14:00", fin: "16:00" },
                ],
            },
            viernes: { activo: false, rangos: [] },
            sabado: { activo: false, rangos: [] },
            domingo: { activo: false, rangos: [] },
        },
    },
    {
        nombre: "Thomas",
        apellido: "Garrido",
        especialidad: "Cirugía, Implantes",
        horarios_atencion: {
            lunes: {
                activo: true,
                rangos: [
                    { inicio: "10:00", fin: "12:00" },
                    { inicio: "14:00", fin: "19:00" },
                ],
            },
            martes: {
                activo: true,
                rangos: [
                    { inicio: "10:00", fin: "12:00" },
                    { inicio: "14:00", fin: "19:00" },
                ],
            },
            miercoles: { activo: false, rangos: [] },
            jueves: { activo: false, rangos: [] },
            viernes: { activo: false, rangos: [] },
            sabado: { activo: false, rangos: [] },
            domingo: { activo: false, rangos: [] },
        },
    },
    {
        nombre: "Florencia",
        apellido: "Garofolo",
        especialidad: "Odontología general",
        horarios_atencion: {
            lunes: {
                activo: true,
                rangos: [
                    { inicio: "10:00", fin: "12:00" },
                    { inicio: "14:00", fin: "18:00" },
                ],
            },
            martes: {
                activo: true,
                rangos: [{ inicio: "14:00", fin: "18:00" }],
            },
            miercoles: { activo: false, rangos: [] },
            jueves: {
                activo: true,
                rangos: [{ inicio: "14:00", fin: "18:00" }],
            },
            viernes: { activo: false, rangos: [] },
            sabado: { activo: false, rangos: [] },
            domingo: { activo: false, rangos: [] },
        },
    },
    {
        nombre: "Jonathan",
        apellido: "Aguilera",
        especialidad: "Endodoncia, Odontología general",
        horarios_atencion: {
            lunes: {
                activo: true,
                rangos: [
                    { inicio: "10:00", fin: "12:00" },
                    { inicio: "14:00", fin: "18:00" },
                ],
            },
            martes: {
                activo: true,
                rangos: [
                    { inicio: "10:00", fin: "12:00" },
                    { inicio: "14:00", fin: "18:00" },
                ],
            },
            miercoles: { activo: false, rangos: [] },
            jueves: {
                activo: true,
                rangos: [
                    { inicio: "10:00", fin: "12:00" },
                    { inicio: "14:00", fin: "18:00" },
                ],
            },
            viernes: { activo: false, rangos: [] },
            sabado: { activo: false, rangos: [] },
            domingo: { activo: false, rangos: [] },
        },
    },
    {
        nombre: "Florencia Ailen",
        apellido: "Arce",
        especialidad: "Odontopediatría",
        horarios_atencion: {
            lunes: {
                activo: true,
                rangos: [
                    { inicio: "10:00", fin: "12:00" },
                    { inicio: "14:00", fin: "18:00" },
                ],
            },
            martes: { activo: false, rangos: [] },
            miercoles: { activo: false, rangos: [] },
            jueves: {
                activo: true,
                rangos: [
                    { inicio: "10:00", fin: "12:00" },
                    { inicio: "14:00", fin: "18:00" },
                ],
            },
            viernes: {
                activo: true,
                rangos: [
                    { inicio: "10:00", fin: "12:00" },
                    { inicio: "14:00", fin: "18:00" },
                ],
            },
            sabado: { activo: false, rangos: [] },
            domingo: { activo: false, rangos: [] },
        },
    },
    {
        nombre: "Sofía",
        apellido: "Vago",
        especialidad: "Odontopediatría",
        horarios_atencion: {
            lunes: { activo: false, rangos: [] },
            martes: { activo: false, rangos: [] },
            miercoles: {
                activo: true,
                rangos: [
                    { inicio: "09:00", fin: "12:00" },
                    { inicio: "14:00", fin: "15:30" },
                ],
            },
            jueves: { activo: false, rangos: [] },
            viernes: {
                activo: true,
                rangos: [
                    { inicio: "10:00", fin: "12:30" },
                    { inicio: "14:00", fin: "18:00" },
                ],
            },
            sabado: { activo: false, rangos: [] },
            domingo: { activo: false, rangos: [] },
        },
    },
    {
        nombre: "Rolando",
        apellido: "Sánchez",
        especialidad: "Ortodoncia",
        horarios_atencion: {
            lunes: { activo: false, rangos: [] },
            martes: {
                activo: true,
                rangos: [
                    { inicio: "10:30", fin: "12:30" },
                    { inicio: "14:00", fin: "19:00" },
                ],
            },
            miercoles: { activo: false, rangos: [] },
            jueves: {
                activo: true,
                rangos: [
                    { inicio: "10:30", fin: "12:30" },
                    { inicio: "14:00", fin: "19:00" },
                ],
            },
            viernes: { activo: false, rangos: [] },
            sabado: { activo: false, rangos: [] },
            domingo: { activo: false, rangos: [] },
        },
    },
];

async function seed() {
    try {
        console.log("Iniciando carga de profesionales...");

        let i = 1;

        for (const data of profesionalesData) {
            // Verificar si ya existe para no duplicar (opcional, por apellido y nombre)
            const existe = await Profesional.findOne({
                where: { nombre: data.nombre, apellido: data.apellido },
            });

            if (existe) {
                console.log(`El profesional ${data.nombre} ${data.apellido} ya existe. Actualizando horarios...`);
                await existe.update({
                    especialidad: data.especialidad,
                    horarios_atencion: data.horarios_atencion
                });
            } else {
                await Profesional.create({
                    ...data,
                    estado: "Activo",
                    numero_documento: `SD-${i}`, // Added index for uniqueness
                    numero_matricula: `SD-${i}`, // Added index for uniqueness
                });
                console.log(`Profesional ${data.nombre} ${data.apellido} creado.`);
            }
            i++;
        }

        console.log("Carga de profesionales finalizada.");
    } catch (error) {
        console.error("Error al cargar profesionales:", error);
    } finally {
        process.exit(0);
    }
}

seed();
