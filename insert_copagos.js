require("dotenv").config()
const { sequelize, Copago, ObraSocial, Servicio } = require("./src/models")

// Mapeo basado en el EXCEL de la imagen 1
// Estructura: { nombre_pattern: { copago_general: monto, por_servicio: {...} } }
const COPAGOS_CONFIG = {
    // IOMA - según el excel tiene copagos específicos
    "Ioma": {
        copago_extraccion: 25000,
        copago_consulta: 10000,
        copago_general: 10000 // Por defecto usar consulta
    },

    // PRIVAMED - diferentes planes con diferentes copagos
    "Privamed 100": { copago_general: 10000 },
    "Privamed 200": { copago_general: 10000 },
    "Privamed 330": { copago_general: 10000 },
    "Privamed 440": { copago_general: 10000 },

    "Privamed 770": { copago_general: 0 }, // NO PAGA COPAGO
    "Privamed 880": { copago_general: 0 }, // NO PAGA COPAGO
    "Privamed 1000": { copago_general: 0 }, // NO PAGA COPAGO
    "Privamed 880 Exento": { copago_general: 0 },
    "Privamed 880 Grav": { copago_general: 0 },

    // OSMECON - según imagen NO PAGA COPAGO
    "Osmecon": { copago_general: 0 },

    // CASA - según imagen NO PAGA COPAGO
    "Casa": { copago_general: 0 },

    // GALENO - según imagen NO PAGA COPAGO
    "Galeno": { copago_general: 0 },

    // DOCTORED, PLAN 500, 1000, 2000
    "Doctored 1000": { copago_general: 0 }, // NO PAGA COPAGO
    "Doctored 500": { copago_general: 10000 },
    "Doctored 505": { copago_general: 10000 },

    // Sancor Salud - $10,000 según imagen
    "Sancor": { copago_general: 10000 },

    // Obras sociales con copago de $14,500 (de la imagen 2)
    "Apres": { copago_general: 14500 },
    "Avalian": { copago_general: 14500 },
    "Andar": { copago_general: 14500 },
    "Asmepriv": { copago_general: 14500 },
    "Omint": { copago_general: 14500 },
    "Dosuba": { copago_general: 14500 },
    "Ensalud": { copago_general: 14500 },
    "Jardineros": { copago_general: 14500 },
    "Osalara": { copago_general: 14500 },
    "Osdop": { copago_general: 14500 },
    "Osim": { copago_general: 14500 },
    "Ospiqyp": { copago_general: 14500 },
    "Ospit": { copago_general: 14500 },
    "Ostel": { copago_general: 14500 },
    "Sadaic": { copago_general: 14500 },
    "Visitar": { copago_general: 14500 },
    "Osptv": { copago_general: 14500 },

    // PAMI - según imagen NO PAGA COPAGO
    "Pami": { copago_general: 0 },

    // Medicus/Medife - según imagen NO PAGA COPAGO
    "Medicus": { copago_general: 0 },
    "Medife": { copago_general: 0 },

    // Otras
    "Particular": { copago_general: 0 },
}

async function actualizarCopagos() {
    try {
        console.log("🔌 Conectando a la base de datos...")
        await sequelize.authenticate()
        console.log("✅ Conexión establecida\n")

        // Obtener todas las obras sociales y servicios
        const obrasSociales = await ObraSocial.findAll()
        const servicios = await Servicio.findAll()

        console.log(`📋 Obras Sociales: ${obrasSociales.length}`)
        console.log(`📋 Servicios: ${servicios.length}\n`)

        // Primero, eliminar todos los copagos existentes
        console.log("🗑️  Eliminando copagos existentes...")
        await Copago.destroy({ where: {}, truncate: true })
        console.log("✅ Copagos eliminados\n")

        let insertados = 0
        let sinConfig = []

        console.log("💰 Insertando copagos...")

        for (const obraSocial of obrasSociales) {
            // Buscar configuración que coincida con el nombre de la obra social
            let config = null
            let matchedPattern = null

            for (const [pattern, cfg] of Object.entries(COPAGOS_CONFIG)) {
                if (obraSocial.nombre.toLowerCase().includes(pattern.toLowerCase())) {
                    config = cfg
                    matchedPattern = pattern
                    break
                }
            }

            if (!config) {
                sinConfig.push(obraSocial.nombre)
                continue
            }

            // Insertar copago para cada servicio
            for (const servicio of servicios) {
                let monto = config.copago_general

                // Si hay configuración específica por tipo de servicio
                if (servicio.nombre.toLowerCase().includes('extraccion') && config.copago_extraccion) {
                    monto = config.copago_extraccion
                } else if (servicio.nombre.toLowerCase().includes('consulta') && config.copago_consulta) {
                    monto = config.copago_consulta
                }

                await Copago.create({
                    servicio_id: servicio.id,
                    obra_social_id: obraSocial.id,
                    monto: monto
                })

                insertados++

                if (monto > 0) {
                    console.log(`  ✅ ${obraSocial.nombre} - ${servicio.nombre}: $${monto.toLocaleString('es-AR')}`)
                }
            }
        }

        console.log(`\n📊 Resumen:`)
        console.log(`  ✅ Copagos insertados: ${insertados}`)
        console.log(`  ⚠️  Obras sociales sin configuración: ${sinConfig.length}`)

        if (sinConfig.length > 0) {
            console.log(`\n⚠️  Obras sociales sin configuración de copago (se asumirá $0):`)
            sinConfig.forEach(os => console.log(`     - ${os}`))
        }

        console.log("\n✨ Proceso completado!")

    } catch (error) {
        console.error("❌ Error:", error)
        throw error
    } finally {
        await sequelize.close()
        console.log("\n🔌 Conexión cerrada")
    }
}

actualizarCopagos()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("💥 Error fatal:", error)
        process.exit(1)
    })
