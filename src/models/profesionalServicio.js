module.exports = (sequelize, DataTypes) => {
  const ProfesionalServicio = sequelize.define(
    "ProfesionalServicio",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      profesional_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "profesionales",
          key: "id",
        },
      },
      servicio_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "servicios",
          key: "id",
        },
      },
      estado: {
        type: DataTypes.ENUM("Activo", "Inactivo"),
        defaultValue: "Activo",
      },
    },
    {
      tableName: "profesionales_servicios",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["profesional_id", "servicio_id"],
        },
      ],
    },
  )

  ProfesionalServicio.associate = (models) => {
    ProfesionalServicio.belongsTo(models.Profesional, {
      foreignKey: "profesional_id",
      as: "profesional",
    })

    ProfesionalServicio.belongsTo(models.Servicio, {
      foreignKey: "servicio_id",
      as: "servicio",
    })
  }

  return ProfesionalServicio
}
