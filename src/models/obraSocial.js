module.exports = (sequelize, DataTypes) => {
  const ObraSocial = sequelize.define(
    "ObraSocial",
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
      plan: {
        type: DataTypes.STRING,
      },
      numero_afiliado: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: "ObrasSociales",
      timestamps: true,
    },
  )

  ObraSocial.associate = (models) => {
    ObraSocial.hasMany(models.Paciente, {
      foreignKey: "obra_social_id",
      as: "pacientes",
    })

    ObraSocial.hasMany(models.PlanTratamiento, {
      foreignKey: "obra_social_id",
      as: "planesTratamiento",
    })
  }

  return ObraSocial
}
