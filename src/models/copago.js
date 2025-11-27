module.exports = (sequelize, DataTypes) => {
  const Copago = sequelize.define(
    "Copago",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      servicio_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "servicios",
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
      monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
    },
    {
      tableName: "copagos",
      timestamps: true,
    },
  )

  Copago.associate = (models) => {
    Copago.belongsTo(models.Servicio, {
      foreignKey: "servicio_id",
      as: "servicio",
    })

    Copago.belongsTo(models.ObraSocial, {
      foreignKey: "obra_social_id",
      as: "obraSocial",
    })
  }

  return Copago
}
