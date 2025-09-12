module.exports = (sequelize, DataTypes) => {
  const Odontograma = sequelize.define(
    "Odontograma",
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
      dientes_data: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
        comment: "Datos de cada diente con sus superficies y estados",
      },
      observaciones: {
        type: DataTypes.TEXT,
      },
      tipo: {
        type: DataTypes.ENUM("Inicial", "Control", "Tratamiento"),
        defaultValue: "Inicial",
      },
    },
    {
      tableName: "odontogramas",
      timestamps: true,
    },
  )

  Odontograma.associate = (models) => {
    Odontograma.belongsTo(models.Paciente, {
      foreignKey: "paciente_id",
      as: "paciente",
    })

    Odontograma.belongsTo(models.Profesional, {
      foreignKey: "profesional_id",
      as: "profesional",
    })
  }

  return Odontograma
}
