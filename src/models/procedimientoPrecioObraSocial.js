module.exports = (sequelize, DataTypes) => {
  const ProcedimientoPrecioObraSocial = sequelize.define(
    "ProcedimientoPrecioObraSocial",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      procedimiento_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Procedimientos",
          key: "id",
        },
      },
      obra_social_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "ObrasSociales",
          key: "id",
        },
      },
      codigo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      precio_paciente: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      usar_precio_particular: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      cobertura: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      precio_sugerido: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
    },
    {
      tableName: "ProcedimientosPreciosObrasSociales",
      timestamps: true,
    },
  )

  ProcedimientoPrecioObraSocial.associate = (models) => {
    ProcedimientoPrecioObraSocial.belongsTo(models.Procedimiento, {
      foreignKey: "procedimiento_id",
      as: "procedimiento",
    })

    ProcedimientoPrecioObraSocial.belongsTo(models.ObraSocial, {
      foreignKey: "obra_social_id",
      as: "obraSocial",
    })
  }

  return ProcedimientoPrecioObraSocial
}
