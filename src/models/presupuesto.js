module.exports = (sequelize, DataTypes) => {
  const Presupuesto = sequelize.define(
    "Presupuesto",
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
        allowNull: true,
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
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      items: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        comment: "Array de items: { descripcion, cantidad, precio_unitario, total }",
      },
      monto_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      estado: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Pendiente", // "Pendiente", "Aprobado", "Rechazado"
      },
      observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "presupuestos",
      timestamps: true,
    }
  )

  Presupuesto.associate = (models) => {
    Presupuesto.belongsTo(models.Paciente, {
      foreignKey: "paciente_id",
      as: "paciente",
    })
    Presupuesto.belongsTo(models.Profesional, {
      foreignKey: "profesional_id",
      as: "profesional",
    })
  }

  return Presupuesto
}
