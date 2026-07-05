// Corrección aprobada (2026-07-05):
// 1) Prestaciones y tratamientos con fecha corrida +1 día por el bug de UTC
//    (cargados entre 21:00 y 23:59 hora argentina) → fecha argentina real.
// 2) Eliminar la liquidación #26 (Generada, sin pagar) revirtiendo sus
//    prestaciones a Pendiente, para regenerarla con fechas correctas.
// Guarda un log con los valores anteriores en fix_fechas_corridas_log.json.
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./src/models');

const CRITERIO = (columna) => `
  ${columna} IS NOT NULL
  AND ${columna}::text = to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')
  AND to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')
      <> to_char("createdAt" AT TIME ZONE 'America/Argentina/Buenos_Aires', 'YYYY-MM-DD')
`;

async function main() {
  const t = await sequelize.transaction();
  try {
    const log = { ejecutado: new Date().toISOString(), prestaciones: [], tratamientos: [], liquidacion_eliminada: null };

    for (const [tabla, columna, key] of [
      ['prestaciones', 'fecha', 'prestaciones'],
      ['tratamientos', 'fecha_inicio', 'tratamientos'],
    ]) {
      const [rows] = await sequelize.query(`
        SELECT id, ${columna}::text AS antes,
               to_char("createdAt" AT TIME ZONE 'America/Argentina/Buenos_Aires', 'YYYY-MM-DD') AS despues
        FROM ${tabla}
        WHERE ${CRITERIO(columna)}
        ORDER BY id
        FOR UPDATE
      `, { transaction: t });
      log[key] = rows;

      const [, meta] = await sequelize.query(`
        UPDATE ${tabla}
        SET ${columna} = to_char("createdAt" AT TIME ZONE 'America/Argentina/Buenos_Aires', 'YYYY-MM-DD')::date
        WHERE ${CRITERIO(columna)}
      `, { transaction: t });
      console.log(`${tabla}.${columna}: ${meta.rowCount} registros corregidos (esperados: ${rows.length})`);
      if (meta.rowCount !== rows.length) throw new Error(`Conteo inesperado en ${tabla}`);
    }

    // Liquidación #26: verificar estado y eliminar revirtiendo prestaciones
    const [[liq]] = await sequelize.query(
      `SELECT id, estado, profesional_id, monto_total_servicios, monto_profesional, cantidad_prestaciones,
              periodo_inicio::text AS periodo_inicio, periodo_fin::text AS periodo_fin, observaciones
       FROM liquidaciones WHERE id = 26 FOR UPDATE`,
      { transaction: t }
    );
    if (!liq) throw new Error('No se encontró la liquidación #26');
    if (liq.estado === 'Pagada') throw new Error('La liquidación #26 figura como Pagada; no se elimina');
    log.liquidacion_eliminada = liq;

    const [, metaPrest] = await sequelize.query(`
      UPDATE prestaciones
      SET liquidacion_id = NULL, estado = 'Pendiente', fecha_liquidacion = NULL
      WHERE liquidacion_id = 26
    `, { transaction: t });
    console.log(`Prestaciones de la liquidación #26 revertidas a Pendiente: ${metaPrest.rowCount}`);

    await sequelize.query(`DELETE FROM liquidaciones WHERE id = 26`, { transaction: t });
    console.log('Liquidación #26 eliminada.');

    fs.writeFileSync(path.join(__dirname, 'fix_fechas_corridas_log.json'), JSON.stringify(log, null, 2));
    await t.commit();
    console.log('\nOK: cambios confirmados. Log de reversión: backend/fix_fechas_corridas_log.json');
  } catch (e) {
    await t.rollback();
    console.error('ROLLBACK — no se aplicó ningún cambio. Motivo:', e.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}
main();
