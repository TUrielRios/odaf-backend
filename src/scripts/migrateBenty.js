const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { sequelize } = require('../models');
const { Paciente, ObraSocial } = require('../models');

// Función para parsear emails del formato JSON del CSV
function parseEmails(emailsStr) {
    try {
        if (!emailsStr) return null;
        const parsed = JSON.parse(emailsStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0]; // Tomamos el primer email
        }
        return null;
    } catch (e) {
        return null;
    }
}

// Función para parsear teléfonos del formato JSON del CSV
function parsePhones(phonesStr) {
    try {
        if (!phonesStr) return null;
        const parsed = JSON.parse(phonesStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0].replace(/\D/g, ''); // Tomamos el primer teléfono y removemos caracteres no numéricos
        }
        return null;
    } catch (e) {
        return null;
    }
}

// Función para parsear fecha de nacimiento
function parseDateOfBirth(dateStr) {
    try {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    } catch (e) {
        return null;
    }
}

// Función para parsear sexo
function parseSex(sexStr) {
    if (!sexStr) return 'Otro';
    if (sexStr === 'M') return 'Masculino';
    if (sexStr === 'F') return 'Femenino';
    return 'Otro';
}

// Función para extraer nombre y apellido del campo "name"
function parseFullName(nameStr) {
    if (!nameStr) return { nombre: 'Sin Nombre', apellido: 'Sin Apellido' };

    // El formato es generalmente: "APELLIDO NOMBRE [otros datos]"
    const parts = nameStr.trim().split(/\s+/);

    if (parts.length === 1) {
        return { nombre: parts[0], apellido: parts[0] };
    }

    // Intentar detectar el apellido (generalmente en mayúsculas completas)
    let apellidoEnd = 0;
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === parts[i].toUpperCase() && parts[i].length > 1) {
            apellidoEnd = i + 1;
        } else {
            break;
        }
    }

    if (apellidoEnd === 0) apellidoEnd = 1;

    const apellido = parts.slice(0, apellidoEnd).join(' ');
    const nombre = parts.slice(apellidoEnd).join(' ') || apellido;

    return {
        nombre: nombre.slice(0, 100),
        apellido: apellido.slice(0, 100)
    };
}

// Cache de obras sociales por nombre
const obrasSocialesCache = {};

async function findOrCreateObraSocial(healthInsuranceData) {
    try {
        if (!healthInsuranceData) {
            // Retornar "Particular" como default
            const cacheKey = 'PARTICULAR';
            if (!obrasSocialesCache[cacheKey]) {
                const [obraSocial] = await ObraSocial.findOrCreate({
                    where: { nombre: 'Particular' },
                    defaults: {
                        nombre: 'Particular',
                        codigo: 'PARTICULAR',
                        activo: true
                    }
                });
                obrasSocialesCache[cacheKey] = obraSocial.id;
            }
            return obrasSocialesCache[cacheKey];
        }

        // Parsear el campo healthInsurance que viene como JSON
        const insurance = JSON.parse(healthInsuranceData);
        if (!insurance || !insurance.insurance || !insurance.insurance.$oid) {
            return obrasSocialesCache['PARTICULAR'];
        }

        // Usar el ObjectId como identificador único
        const oid = insurance.insurance.$oid;

        if (!obrasSocialesCache[oid]) {
            // Crear una obra social con nombre basado en el OID
            const [obraSocial] = await ObraSocial.findOrCreate({
                where: { codigo: `BENTY_${oid}` },
                defaults: {
                    nombre: `Obra Social Importada ${oid.substring(0, 8)}`,
                    codigo: `BENTY_${oid}`,
                    activo: true
                }
            });
            obrasSocialesCache[oid] = obraSocial.id;
        }

        return obrasSocialesCache[oid];
    } catch (e) {
        console.error('Error procesando obra social:', e.message);
        // En caso de error, retornar "Particular"
        if (!obrasSocialesCache['PARTICULAR']) {
            const [obraSocial] = await ObraSocial.findOrCreate({
                where: { nombre: 'Particular' },
                defaults: {
                    nombre: 'Particular',
                    codigo: 'PARTICULAR',
                    activo: true
                }
            });
            obrasSocialesCache['PARTICULAR'] = obraSocial.id;
        }
        return obrasSocialesCache['PARTICULAR'];
    }
}

async function migratePacientes() {
    const csvPath = path.join(__dirname, '../../benty/pacientes.csv');
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    console.log('Iniciando migración de pacientes desde Benty...');
    console.log(`Leyendo archivo: ${csvPath}\n`);

    return new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (row) => {
                results.push(row);
            })
            .on('end', async () => {
                console.log(`Total de registros en CSV: ${results.length}\n`);

                for (const row of results) {
                    try {
                        // Parsear los datos del CSV
                        const { nombre, apellido } = parseFullName(row.name);
                        const email = parseEmails(row.emails);
                        const telefono = parsePhones(row.phones);
                        const fecha_nacimiento = parseDateOfBirth(row.dateOfBirth);
                        const sexo = parseSex(row.sex);

                        // Si no tiene número de documento, saltamos
                        if (!row['identification.number']) {
                            skippedCount++;
                            console.log(`⚠️  Paciente sin DNI: ${nombre} ${apellido} - OMITIDO`);
                            continue;
                        }

                        // Verificar si ya existe este paciente por documento
                        const existingPaciente = await Paciente.findOne({
                            where: { numero_documento: row['identification.number'] }
                        });

                        if (existingPaciente) {
                            skippedCount++;
                            console.log(`ℹ️  Paciente ya existe: ${nombre} ${apellido} (DNI: ${row['identification.number']})`);
                            continue;
                        }

                        // Obtener o crear obra social
                        const obra_social_id = await findOrCreateObraSocial(row.healthInsurance);

                        // Crear el registro del paciente
                        await Paciente.create({
                            apellido,
                            nombre,
                            tipo_documento: row['identification.idType'] || 'DNI',
                            numero_documento: row['identification.number'],
                            obra_social_id,
                            fecha_nacimiento: fecha_nacimiento || '2000-01-01', // Default si no tiene fecha
                            sexo,
                            direccion: row.address || null,
                            ocupacion: row.ocupation || null,
                            email: email,
                            telefono: telefono,
                            informacion_adicional: row.info || null,
                            condicion: row.active === 'false' ? 'Inactivo' : 'Activo'
                        });

                        successCount++;
                        console.log(`✓ Migrado: ${nombre} ${apellido} (DNI: ${row['identification.number']})`);

                    } catch (error) {
                        errorCount++;
                        console.error(`✗ Error al migrar paciente ${row.name}:`, error.message);
                    }
                }

                console.log('\n' + '='.repeat(50));
                console.log('RESUMEN DE MIGRACIÓN');
                console.log('='.repeat(50));
                console.log(`Total procesados: ${results.length}`);
                console.log(`✓ Exitosos: ${successCount}`);
                console.log(`⚠️  Omitidos (duplicados o sin DNI): ${skippedCount}`);
                console.log(`✗ Errores: ${errorCount}`);
                console.log('='.repeat(50));

                resolve({
                    total: results.length,
                    success: successCount,
                    skipped: skippedCount,
                    errors: errorCount
                });
            })
            .on('error', (error) => {
                console.error('Error leyendo CSV:', error);
                reject(error);
            });
    });
}

// Ejecutar la migración
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida.\n');

        const result = await migratePacientes();

        console.log('\n✓ Migración completada!');
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('Error en la migración:', error);
        process.exit(1);
    }
})();
