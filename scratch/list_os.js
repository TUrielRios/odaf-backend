const { ObraSocial } = require("../src/models");

async function run() {
  try {
    const list = await ObraSocial.findAll({ order: [["nombre", "ASC"]] });
    console.log("Current Obras Sociales count:", list.length);
    console.log("First 10 Obras Sociales:");
    list.slice(0, 10).forEach(os => console.log(`- ID: ${os.id}, Nombre: "${os.nombre}"`));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
