module.exports = (sequelize, DataTypes) => {
  const Procedimiento = sequelize.define(
    "Procedimiento",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      precio_ars: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      precio_usd: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
    },
    {
      tableName: "Procedimientos",
      timestamps: true,
    },
  )

  Procedimiento.associate = (models) => {
    Procedimiento.hasMany(models.ProcedimientoPrecioObraSocial, {
      foreignKey: "procedimiento_id",
      as: "preciosObraSocial",
      onDelete: "CASCADE",
    })
  }

  return Procedimiento
}
