const { sequelize, Liquidacion, Profesional } = require('../models');

const SETTLEMENTS_TO_MIGRATE = [
  {
    profesional_id: 8,
    nombre: 'Jonathan Aguilera',
    periodo_inicio: '2026-05-01',
    periodo_fin: '2026-05-03',
    monto: 1005289.50,
  },
  {
    profesional_id: 13,
    nombre: 'Salinas Sabrina',
    periodo_inicio: '2026-05-01',
    periodo_fin: '2026-05-03',
    monto: 464089.60,
  },
  {
    profesional_id: 18,
    nombre: 'Arce Florencia Ailen',
    periodo_inicio: '2026-05-01',
    periodo_fin: '2026-05-03',
    monto: 212462.46,
  }
];

async function migrate() {
  console.log('Iniciando migración de las liquidaciones de Mayo 2026...');
  
  const t = await sequelize.transaction();
  
  try {
    for (const item of SETTLEMENTS_TO_MIGRATE) {
      // Verificar si el profesional existe
      const prof = await Profesional.findByPk(item.profesional_id, { transaction: t });
      if (!prof) {
        throw new Error(`Profesional con ID ${item.profesional_id} (${item.nombre}) no encontrado.`);
      }

      // Verificar si la liquidación ya existe para evitar duplicados
      const existing = await Liquidacion.findOne({
        where: {
          profesional_id: item.profesional_id,
          periodo_inicio: item.periodo_inicio,
          periodo_fin: item.periodo_fin
        },
        transaction: t
      });

      if (existing) {
        console.log(`- Liquidación ya existe para ${prof.apellido} ${prof.nombre} del ${item.periodo_inicio} al ${item.periodo_fin}. ID: ${existing.id}. Saltando...`);
        continue;
      }

      // Crear la liquidación (siguiendo el patrón de migración previo)
      const created = await Liquidacion.create({
        profesional_id: item.profesional_id,
        periodo_inicio: item.periodo_inicio,
        periodo_fin: item.periodo_fin,
        monto_total_servicios: item.monto,
        monto_profesional: item.monto,
        cantidad_prestaciones: 1,
        estado: 'Pagada',
        fecha_pago: item.periodo_fin,
        metodo_pago: null,
        observaciones: 'Migración de sistema anterior',
        detalles: null
      }, { transaction: t });

      console.log(`✓ Liquidación CREADA para ${prof.apellido} ${prof.nombre} (ID: ${created.id}) | Período: ${item.periodo_inicio} a ${item.periodo_fin} | Monto: $${item.monto}`);
    }

    await t.commit();
    console.log('\n¡Migración de liquidaciones finalizada exitosamente!');
  } catch (error) {
    await t.rollback();
    console.error('Error durante la migración de liquidaciones:', error);
  } finally {
    process.exit();
  }
}

migrate();
