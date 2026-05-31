const { sequelize, Turno, Paciente } = require('../src/models');
const { Op } = require('sequelize');

const APPOINTMENTS_DATA = [
  // Martes 2 de Junio
  { fecha: '2026-06-02', hora: '09:00', paciente: 'LOPEZ GRACIELA', obra_social: 'pami' },
  { fecha: '2026-06-02', hora: '09:00', paciente: 'SANTILLAN ADRIANA', obra_social: 'pami' },
  { fecha: '2026-06-02', hora: '09:30', paciente: 'BEATRIZ', obra_social: 'pami' },
  { fecha: '2026-06-02', hora: '09:30', paciente: 'ZAMUDIO', obra_social: 'pami' },
  { fecha: '2026-06-02', hora: '10:00', paciente: 'PRIMICIA MARIA CRISTINA', obra_social: 'pami' },
  { fecha: '2026-06-02', hora: '10:30', paciente: 'JULIA', obra_social: 'pami' },
  { fecha: '2026-06-02', hora: '10:30', paciente: 'MARIA', obra_social: 'pami' },
  { fecha: '2026-06-02', hora: '11:00', paciente: 'KLUG MARIA TERESA', obra_social: 'pami' },
  { fecha: '2026-06-02', hora: '11:30', paciente: 'ANA', obra_social: 'pami' },
  { fecha: '2026-06-02', hora: '11:30', paciente: 'ORLANDO', obra_social: 'pami' },
  { fecha: '2026-06-02', hora: '12:00', paciente: 'RINENBERG JORGE ENRIQUE', obra_social: 'pami' },
  { fecha: '2026-06-02', hora: '12:30', paciente: 'PACIENTE PAMI 1', obra_social: 'pami' },
  { fecha: '2026-06-02', hora: '12:30', paciente: 'CORTE', obra_social: 'pami' },

  // Miércoles 3 de Junio
  { fecha: '2026-06-03', hora: '08:00', paciente: 'ANTONIA', obra_social: 'pami' },
  { fecha: '2026-06-03', hora: '08:00', paciente: 'PIRRA', obra_social: 'pami' },
  { fecha: '2026-06-03', hora: '08:30', paciente: 'CIAPPARELLI NESTOR OSCAR', obra_social: 'pami' },
  { fecha: '2026-06-03', hora: '09:00', paciente: 'LOPEZ ANA MARIA', obra_social: 'pami' },
  { fecha: '2026-06-03', hora: '09:30', paciente: 'STANCATI VICTOR DARIO', obra_social: 'pami' },
  { fecha: '2026-06-03', hora: '10:00', paciente: 'BELLOMO SUSANA', obra_social: 'pami' },
  { fecha: '2026-06-03', hora: '10:30', paciente: 'LESCANO ANTONIA DELIA', obra_social: 'pami' },
  { fecha: '2026-06-03', hora: '11:30', paciente: 'SENA DIAZ DIONISIA', obra_social: 'pami' },

  // Jueves 4 de Junio
  { fecha: '2026-06-04', hora: '09:00', paciente: 'ANGEL', obra_social: 'pami' },
  { fecha: '2026-06-04', hora: '09:00', paciente: 'VILLOLDO ELSA VIVIANA', obra_social: 'pami' },
  { fecha: '2026-06-04', hora: '09:30', paciente: 'DIAZ NELSON MIGUEL', obra_social: 'pami' },
  { fecha: '2026-06-04', hora: '10:00', paciente: 'JORGE', obra_social: 'pami' },
  { fecha: '2026-06-04', hora: '10:00', paciente: 'GIAN', obra_social: 'pami' },
  { fecha: '2026-06-04', hora: '10:30', paciente: 'GARCIA JUAN CARLOS', obra_social: 'pami' },
  { fecha: '2026-06-04', hora: '11:00', paciente: 'OLGA', obra_social: 'pami' },
  { fecha: '2026-06-04', hora: '11:00', paciente: 'ROMANA', obra_social: 'pami' },
  { fecha: '2026-06-04', hora: '11:30', paciente: 'BEGNIS GRACIELA PATRICIA', obra_social: 'pami' },
  { fecha: '2026-06-04', hora: '12:00', paciente: 'SOSA VICTORIA', obra_social: 'pami' },
  { fecha: '2026-06-04', hora: '12:30', paciente: 'GENERO ENZO EMILIO', obra_social: 'pami' },

  // Martes 9 de Junio
  { fecha: '2026-06-09', hora: '09:00', paciente: 'VITA ROBERTO', obra_social: 'pami' },
  { fecha: '2026-06-09', hora: '09:00', paciente: 'ZANETTI ANGEL LEONARDO', obra_social: 'pami' },
  { fecha: '2026-06-09', hora: '09:30', paciente: 'PEGORARO ELBA YOLANDA', obra_social: 'pami' },
  { fecha: '2026-06-09', hora: '10:00', paciente: 'ARIAS TITO LIVIO', obra_social: 'pami' },
  { fecha: '2026-06-09', hora: '10:30', paciente: 'MORRA ALICIA BEATRIZ', obra_social: 'pami' },
  { fecha: '2026-06-09', hora: '10:30', paciente: 'SANTOS GACIÑO FRANCISCO', obra_social: 'pami' },
  { fecha: '2026-06-09', hora: '11:00', paciente: 'INTERLANDI GRACIELA', obra_social: 'pami' },
  { fecha: '2026-06-09', hora: '11:30', paciente: 'CHIMENTI FRANCISCO', obra_social: 'pami' },
  { fecha: '2026-06-09', hora: '12:00', paciente: 'DELGADO OSCAR EDMUNDO', obra_social: 'pami' },
  { fecha: '2026-06-09', hora: '12:00', paciente: 'SETAU ORLINDA MARGARITA', obra_social: 'pami' },
  { fecha: '2026-06-09', hora: '12:30', paciente: 'BINETTI RAFAEL', obra_social: 'pami' },

  // Miércoles 10 de Junio
  { fecha: '2026-06-10', hora: '08:00', paciente: 'TOMALINI ADRIANA BEATRIZ', obra_social: 'pami' },
  { fecha: '2026-06-10', hora: '08:30', paciente: 'ARANDA MARTA LUZ', obra_social: 'pami' },
  { fecha: '2026-06-10', hora: '09:00', paciente: 'COSTAS RAMON HORACIO', obra_social: 'pami' },
  { fecha: '2026-06-10', hora: '10:00', paciente: 'DE ROBERTIS ISABEL ROSE', obra_social: 'pami' },
  { fecha: '2026-06-10', hora: '11:00', paciente: 'NIEVA BEATRIZ', obra_social: 'pami' },

  // Jueves 11 de Junio
  { fecha: '2026-06-11', hora: '09:00', paciente: 'HERRERA EVA LUCIA', obra_social: 'pami' },
  { fecha: '2026-06-11', hora: '09:30', paciente: 'BENITEZ MICAELA JANET', obra_social: 'pami' },
  { fecha: '2026-06-11', hora: '10:00', paciente: 'ALOI ANA MARIA', obra_social: 'pami' },
  { fecha: '2026-06-11', hora: '10:00', paciente: 'VAZQUEZ ELSA MARIA', obra_social: 'pami' },
  { fecha: '2026-06-11', hora: '10:30', paciente: 'MORINIGO PAULA LIDIA', obra_social: 'pami' },
  { fecha: '2026-06-11', hora: '11:00', paciente: 'ARCE DIAZ JOSEFA DOMINGA', obra_social: 'pami' },
  { fecha: '2026-06-11', hora: '11:00', paciente: 'MELLINO ANTONIA', obra_social: 'pami' },
  { fecha: '2026-06-11', hora: '11:30', paciente: 'FERNANDEZ EMMA', obra_social: 'pami' },
  { fecha: '2026-06-11', hora: '12:00', paciente: 'LESCANO ANTONIA DELIA', obra_social: 'pami' },
  { fecha: '2026-06-11', hora: '12:00', paciente: 'LINARI OSCAR HUMBERTO', obra_social: 'pami' },
  { fecha: '2026-06-11', hora: '12:30', paciente: 'PEREYRA SANDRA', obra_social: 'pami' },

  // Martes 16 de Junio
  { fecha: '2026-06-16', hora: '09:00', paciente: 'CAVALLARO MARIO ANTONIO', obra_social: 'pami' },
  { fecha: '2026-06-16', hora: '09:00', paciente: 'GATTI CASILDA IRMA', obra_social: 'pami' },
  { fecha: '2026-06-16', hora: '09:30', paciente: 'BRITEZ RAMIREZ ISABEL', obra_social: 'pami' },
  { fecha: '2026-06-16', hora: '10:00', paciente: 'PEREIRA SILVA MARIA', obra_social: 'pami' },
  { fecha: '2026-06-16', hora: '10:00', paciente: 'VILCHES MIGUEL ANGEL', obra_social: 'pami' },
  { fecha: '2026-06-16', hora: '10:30', paciente: 'JIMENEZ MIRIAM ELISABET', obra_social: 'pami' },
  { fecha: '2026-06-16', hora: '11:00', paciente: 'ZABALA EDUARDO ALBERTO', obra_social: 'pami' },
  { fecha: '2026-06-16', hora: '11:30', paciente: 'MUÑOZ NELLY ANA', obra_social: 'pami' },
  { fecha: '2026-06-16', hora: '11:30', paciente: 'VARGAS ALBERTO OSCAR', obra_social: 'pami' },
  { fecha: '2026-06-16', hora: '12:00', paciente: 'GOMEZ DANIEL OSVALDO', obra_social: 'pami' },
  { fecha: '2026-06-16', hora: '12:30', paciente: 'GNESUTTA NANCY LILIAN', obra_social: 'pami' },

  // Miércoles 17 de Junio
  { fecha: '2026-06-17', hora: '09:00', paciente: 'GUTIERREZ OSCAR', obra_social: 'pami' },
  { fecha: '2026-06-17', hora: '11:00', paciente: 'IBARRA MARIA ESTER', obra_social: 'pami' },
  { fecha: '2026-06-17', hora: '11:30', paciente: 'GUIMARD CONTRERAS LOURDES', obra_social: 'pami' },

  // Jueves 18 de Junio
  { fecha: '2026-06-18', hora: '09:00', paciente: 'BARROS GUILLERMO', obra_social: 'pami' },
  { fecha: '2026-06-18', hora: '09:00', paciente: 'SILVA PABLO ELIAN', obra_social: 'pami' },
  { fecha: '2026-06-18', hora: '09:30', paciente: 'SILVA SOFIA AYLEN', obra_social: 'pami' },
  { fecha: '2026-06-18', hora: '10:00', paciente: 'MANSILLA SONIA GRACIELA', obra_social: 'pami' },
  { fecha: '2026-06-18', hora: '10:00', paciente: 'MOLINA IRMA BEATRIZ', obra_social: 'pami' },
  { fecha: '2026-06-18', hora: '10:30', paciente: 'LOPEZ HECTOR FLORENCIO', obra_social: 'pami' },
  { fecha: '2026-06-18', hora: '11:00', paciente: 'ACUÑA NILDA LEONOR', obra_social: 'pami' },
  { fecha: '2026-06-18', hora: '11:00', paciente: 'FERNANDEZ ADRIANA', obra_social: 'pami' },
  { fecha: '2026-06-18', hora: '11:30', paciente: 'GALEANO MARIA LUISA', obra_social: 'pami' },
  { fecha: '2026-06-18', hora: '12:00', paciente: 'VARELA GABRIEL AGUSTIN', obra_social: 'pami' },
  { fecha: '2026-06-18', hora: '12:30', paciente: 'MAINERO JOSE MARIA', obra_social: 'pami' },

  // Martes 23 de Junio
  { fecha: '2026-06-23', hora: '09:00', paciente: 'BONAFINE JULIO ALBERTO', obra_social: 'pami' },
  { fecha: '2026-06-23', hora: '09:00', paciente: 'CANNAROZZI MIGUEL ANGEL', obra_social: 'pami' },
  { fecha: '2026-06-23', hora: '09:30', paciente: 'MARSICOVETERE MARIA ELIDA', obra_social: 'pami' },
  { fecha: '2026-06-23', hora: '10:00', paciente: 'KOHAN LILIAN GABRIELA', obra_social: 'pami' },
  { fecha: '2026-06-23', hora: '10:30', paciente: 'BASILE SUSANA BEATRIZ', obra_social: 'pami' },
  { fecha: '2026-06-23', hora: '11:00', paciente: 'SANCHEZ MARIA MARTA', obra_social: 'pami' },
  { fecha: '2026-06-23', hora: '11:30', paciente: 'VALLERINO HECTOR ENRIQUE', obra_social: 'pami' },
  { fecha: '2026-06-23', hora: '12:00', paciente: 'BENEDETTI JOSE BENITO', obra_social: 'pami' },
  { fecha: '2026-06-23', hora: '12:30', paciente: 'GONZALEZ ESTELA SARA', obra_social: 'pami' },
  { fecha: '2026-06-23', hora: '17:00', paciente: 'GONCALVES REHLINGER IRENE', obra_social: 'pami' },

  // Miércoles 24 de Junio
  { fecha: '2026-06-24', hora: '08:00', paciente: 'TOMALINI ADRIANA BEATRIZ', obra_social: 'pami' },

  // Jueves 25 de Junio
  { fecha: '2026-06-25', hora: '09:00', paciente: 'MARDONES FEDERICO', obra_social: 'pami' },
  { fecha: '2026-06-25', hora: '09:30', paciente: 'ODOGUARDI LUCRECIA ESTHER', obra_social: 'pami' },
  { fecha: '2026-06-25', hora: '09:30', paciente: 'PUCHETA RAUL NORBERTO', obra_social: 'pami' },
  { fecha: '2026-06-25', hora: '10:00', paciente: 'CAMPANELLA MARIA CRISTINA', obra_social: 'pami' },
  { fecha: '2026-06-25', hora: '10:30', paciente: 'BLANCO ESTELA GLADYS', obra_social: 'pami' },
  { fecha: '2026-06-25', hora: '11:00', paciente: 'DKEINI EMILIO ALEJANDRO', obra_social: 'pami' },
  { fecha: '2026-06-25', location: '11:30', paciente: 'CORTEZ LUIS JORGE', obra_social: 'pami' },
  { fecha: '2026-06-25', hora: '12:00', paciente: 'BOJARSKI ROSA', obra_social: 'pami' },
  { fecha: '2026-06-25', hora: '12:30', paciente: 'SEGOVIA MARIA DEL CARMEN', obra_social: 'pami' },

  // Martes 30 de Junio
  { fecha: '2026-06-30', hora: '08:00', paciente: 'DAMIANO MARIA', obra_social: 'pami' },
  { fecha: '2026-06-30', hora: '09:00', paciente: 'ZECCA VALERIA SAMANTA', obra_social: 'pami' },
  { fecha: '2026-06-30', hora: '09:30', paciente: 'IGLESIAS JOSE ENRIQUE', obra_social: 'pami' },
  { fecha: '2026-06-30', hora: '10:00', paciente: 'BERTOYA GRACIELA', obra_social: 'pami' },
  { fecha: '2026-06-30', hora: '10:00', paciente: 'ESTRELLA MARIA CRISTINA', obra_social: 'pami' },
  { fecha: '2026-06-30', hora: '10:30', paciente: 'BIANCO JOSEFINA ROSA', obra_social: 'pami' },
  { fecha: '2026-06-30', hora: '10:30', paciente: 'VIECENZ SILVIA BEATRIZ', obra_social: 'pami' },
  { fecha: '2026-06-30', hora: '11:30', paciente: 'FERNANDEZ LILIANA NOEMI', obra_social: 'pami' },
  { fecha: '2026-06-30', hora: '12:00', paciente: 'FRAGNITO ADRIANA CARMEN', obra_social: 'pami' },
  { fecha: '2026-06-30', hora: '12:00', paciente: 'TOPORZYC ROSA ALBA', obra_social: 'pami' },
  { fecha: '2026-06-30', hora: '12:30', paciente: 'PIÑERO NORA RITA', obra_social: 'pami' }
];

async function main() {
  try {
    const turnos = await Turno.findAll({
      where: {
        profesional_id: 7,
        fecha: {
          [Op.between]: ['2026-06-01', '2026-06-30']
        }
      },
      include: [{ model: Paciente, as: 'paciente' }]
    });

    console.log(`Fetched ${turnos.length} turnos from DB.`);

    const missing = [];
    const matched = [];

    for (const appt of APPOINTMENTS_DATA) {
      const match = turnos.find(t => t.fecha === appt.fecha && t.hora_inicio === `${appt.hora || '11:30'}:00`);
      if (match) {
        matched.push({ appt, found: match });
      } else {
        missing.push(appt);
      }
    }

    console.log(`Total checked: ${APPOINTMENTS_DATA.length}`);
    console.log(`Matched: ${matched.length}`);
    console.log(`Missing: ${missing.length}`);
    if (missing.length > 0) {
      console.log('Missing appointments details:');
      missing.forEach(m => console.log(`- ${m.fecha} ${m.hora}: ${m.paciente}`));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

main();
