module.exports = (sequelize, DataTypes) => {
  const HistorialClinico = sequelize.define(
    "HistorialClinico",
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
      motivo_consulta: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      enfermedad_actual: {
        type: DataTypes.TEXT,
      },
      antecedentes_personales: {
        type: DataTypes.TEXT,
      },
      antecedentes_familiares: {
        type: DataTypes.TEXT,
      },
      examen_clinico: {
        type: DataTypes.TEXT,
      },
      diagnostico: {
        type: DataTypes.TEXT,
      },
      tratamiento_realizado: {
        type: DataTypes.TEXT,
      },
      observaciones: {
        type: DataTypes.TEXT,
      },
      signos_vitales: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
    },
    {
      tableName: "historiales_clinicos",
      timestamps: true,
    },
  )

  HistorialClinico.associate = (models) => {
    HistorialClinico.belongsTo(models.Paciente, {
      foreignKey: "paciente_id",
      as: "paciente",
    })

    HistorialClinico.belongsTo(models.Profesional, {
      foreignKey: "profesional_id",
      as: "profesional",
    })
  }

  return HistorialClinico
}
