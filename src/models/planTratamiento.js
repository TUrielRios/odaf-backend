module.exports = (sequelize, DataTypes) => {
  const PlanTratamiento = sequelize.define(
    "PlanTratamiento",
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
      obra_social_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "ObrasSociales",
          key: "id",
        },
      },
      fecha_creacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      fecha_inicio: {
        type: DataTypes.DATEONLY,
      },
      fecha_fin_estimada: {
        type: DataTypes.DATEONLY,
      },
      tratamientos: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        comment: "Array de tratamientos con detalles, costos, estado",
      },
      costo_total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      costo_obra_social: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      costo_paciente: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      estado: {
        type: DataTypes.ENUM("Pendiente", "En_Progreso", "Completado", "Cancelado"),
        defaultValue: "Pendiente",
      },
      observaciones: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "planes_tratamiento",
      timestamps: true,
    },
  )

  PlanTratamiento.associate = (models) => {
    PlanTratamiento.belongsTo(models.Paciente, {
      foreignKey: "paciente_id",
      as: "paciente",
    })

    PlanTratamiento.belongsTo(models.Profesional, {
      foreignKey: "profesional_id",
      as: "profesional",
    })

    PlanTratamiento.belongsTo(models.ObraSocial, {
      foreignKey: "obra_social_id",
      as: "obraSocial",
    })
  }

  return PlanTratamiento
}
