module.exports = (sequelize, DataTypes) => {
  const Prescripcion = sequelize.define(
    "Prescripcion",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      paciente_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "pacientes",
          key: "id",
        },
      },
      profesional_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "profesionales",
          key: "id",
        },
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      medicamentos: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        comment: "Array de medicamentos con dosis, frecuencia, duración",
      },
      indicaciones: {
        type: DataTypes.TEXT,
      },
      observaciones: {
        type: DataTypes.TEXT,
      },
      estado: {
        type: DataTypes.ENUM("Activa", "Completada", "Cancelada"),
        defaultValue: "Activa",
      },
    },
    {
      tableName: "prescripciones",
      timestamps: true,
    },
  )

  Prescripcion.associate = (models) => {
    Prescripcion.belongsTo(models.Paciente, {
      foreignKey: "paciente_id",
      as: "paciente",
    })

    Prescripcion.belongsTo(models.Profesional, {
      foreignKey: "profesional_id",
      as: "profesional",
    })
  }

  return Prescripcion
}
