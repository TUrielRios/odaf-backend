const { execSync } = require('child_process');
require('dotenv').config();

// Construir la cadena de conexión
const connString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

console.log("🔧 Reseteando secuencias...\n");

const tables = [
    'movimientos_cuenta',
    'turnos',
    'pacientes',
    'profesionales',
    'servicios',
    '"ObrasSociales"',
    'liquidaciones',
    'copagos'
];

const sql = tables.map(table => {
    const cleanTable = table.replace(/"/g, '');
    return `SELECT setval('${cleanTable}_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM ${table}), false);`
}).join('\n');

console.log("SQL a ejecutar:");
console.log(sql);
console.log("\n📝 Copia y ejecuta este script directamente en Railway Dashboard > Database > Query\n");
console.log("O guárdalo en un archivo .sql y ejecútalo desde allí.");
