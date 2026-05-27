const { ObraSocial } = require("../src/models");

const renameMapping = {
  "Ioma": "20 Ioma",
  "Galeno": "24 Galeno",
  "Amebpba": "Amebpba Circulo 22",
  "Sancor Salud": "40 Sancor Salud",
  "Staff Medico": "83 Staff Medico",
  "A M F F A": "Amffa 55 Farmaceuticos Florencio Ameghino",
  "Amffa Mutualistas Farmaceuticos": "Amffa 55 Farmaceuticos Florencio Ameghino",
  "Doctored 500 Roisa": "Doctored 500 Roisa",
  "Doctored 505": "Doctored 500 Roisa",
  "Prevencion Salud Circulo": "Prevencion Salud Circulo 60",
  "Servicio Penitenciario Federal": "Servicio Penitenciario Federal 57",
  "Privamed 440": "Privamed 440 Copago",
  "Privamed 330": "Privamed 330 Copago",
  "Doctored Premium Copago": "Doctored Ospese Roisa",
  "Omint Consulmed": "Omint Circulo 03",
  "Igualdad Salud Roisa": "Igualdad Salud Roisa Suspendida",
  "Salud 360 Redsom": "Salud 360 Sin Copago Redsom",
  "A Osblyca Cueros Y Anexos": "68 A Osblyca Cueros Y Anexos",
  "Medicus": "Medicus 97",
  "Medife": "95 Medife",
};

const targetNames = [
  "20 Ioma",
  "Osmecon",
  "Casa Circulo 51",
  "24 Galeno",
  "Assist Dent",
  "Amebpba Circulo 22",
  "Poder Judicial",
  "40 Sancor Salud",
  "83 Staff Medico",
  "Amffa 55 Farmaceuticos Florencio Ameghino",
  "America Servicios",
  "Jerarquicos Salud",
  "Ospib Roisa",
  "Imp Roisa",
  "Ospit Textiles Copago Roisa",
  "Avalian 16",
  "Osamoc Roisa",
  "Doctored 500 Roisa",
  "Doctored 2000",
  "Doctored 1000",
  "Doctored 3000",
  "Prevencion Salud Circulo 60",
  "Servicio Penitenciario Federal 57",
  "Accord Salud",
  "Pami",
  "Privamed 770",
  "Privamed 440 Copago",
  "Privamed 330 Copago",
  "Privamed 660 Copago",
  "Privamed 550 Copago",
  "Privamed 1000",
  "Colegio De Escribanos",
  "Federada Salud",
  "Osmiss Copago Roisa",
  "Ospep Roisa",
  "Doctored Ospese Roisa",
  "Clero",
  "Bienestar Salud Copago Roisa",
  "Ospfp Pintura Roisa",
  "Visitar Consulmed Copago",
  "Apres Consulmed",
  "Omint Circulo 03",
  "Dosuba Consulmed",
  "Ensalud Consulmed",
  "Jardineros Consulmed",
  "Osalara Consulmed",
  "Osptv Sat Consulmed",
  "Sadaic Consulmed",
  "Ostel Telefonicos Consulmed",
  "Ospiqyp Quimica Y Petrolera Consulmed",
  "Asmepriv Consulmed",
  "Andar Consulmed",
  "Visitar Consulmed",
  "Osim Consulmed",
  "Osdop Consulmed",
  "Igualdad Salud Roisa Suspendida",
  "Premedic",
  "Premedic 100",
  "Premedic 200",
  "Premedic 300",
  "Premedic 400 500",
  "Salud 360 Sin Copago Redsom",
  "Saber Salud Redsom Copago",
  "68 A Osblyca Cueros Y Anexos",
  "Privamed 880 Exento",
  "Privamed 880 Grav",
  "Medicus 97",
  "95 Medife",
  "Doctored Cuidarte Plus"
];

async function updateObrasSociales() {
  try {
    // 1. Perform Renames to keep existing relations intact
    for (const [oldName, newName] of Object.entries(renameMapping)) {
      const existingOld = await ObraSocial.findOne({ where: { nombre: oldName } });
      if (existingOld) {
        console.log(`Renaming "${oldName}" to "${newName}"...`);
        await existingOld.update({ nombre: newName });
      }
    }

    // 2. Ensure all target names exist
    for (const name of targetNames) {
      const exists = await ObraSocial.findOne({ where: { nombre: name } });
      if (!exists) {
        console.log(`Creating missing Obra Social: "${name}"...`);
        await ObraSocial.create({ nombre: name });
      }
    }

    console.log("Database update of Obras Sociales completed successfully.");
  } catch (error) {
    console.error("Error updating Obras Sociales:", error);
  } finally {
    process.exit(0);
  }
}

updateObrasSociales();
