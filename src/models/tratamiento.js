module.exports = (sequelize, DataTypes) => {
  const Tratamiento = sequelize.define(
    "Tratamiento",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      plan_tratamiento_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "planes_tratamiento",
          key: "id",
        },
      },
      procedimiento_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Procedimientos",
          key: "id",
        },
      },
      profesional_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "profesionales",
          key: "id",
        },
      },
      nomenclador: {
        type: DataTypes.STRING,
        allowNull: false,
        comment:
          "Pieza | Maxilar superior | Maxilar inferior | Maxilar superior e inferior | Sector 1 | Sector 2 | Sector 3 | Sector 4 | Sector 5 | Sector 6",
      },
      pieza_numero: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Número de pieza dental (ej: 2.4). Solo cuando nomenclador es Pieza",
      },
      pieza_superficies: {
        type: DataTypes.JSON,
        allowNull: true,
        comment:
          "Superficies marcadas del diente: { oclusal, vestibular, lingual, mesial, distal }. Solo referencia visual",
      },
      fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      estado: {
        type: DataTypes.ENUM("Pendiente", "Comenzado", "Cancelado", "Terminado"),
        defaultValue: "Pendiente",
      },
      precio_paciente: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      cobertura_obra_social: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      autorizado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Indica si la obra social autorizó este tratamiento",
      },
      observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "tratamientos",
      timestamps: true,
    }
  )

  Tratamiento.associate = (models) => {
    Tratamiento.belongsTo(models.PlanTratamiento, {
      foreignKey: "plan_tratamiento_id",
      as: "planTratamiento",
    })

    Tratamiento.belongsTo(models.Procedimiento, {
      foreignKey: "procedimiento_id",
      as: "procedimiento",
    })

    Tratamiento.belongsTo(models.Profesional, {
      foreignKey: "profesional_id",
      as: "profesional",
    })
  }

  return Tratamiento
}
