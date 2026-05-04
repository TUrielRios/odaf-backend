module.exports = (sequelize, DataTypes) => {
  const Ausencia = sequelize.define(
    "Ausencia",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      profesional_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      fecha_fin: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      hora_inicio: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      hora_fin: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      motivo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "ausencias",
      timestamps: true,
    }
  )

  Ausencia.associate = (models) => {
    Ausencia.belongsTo(models.Profesional, {
      foreignKey: "profesional_id",
      as: "profesional",
    })
    // En el modelo de Profesional deberíamos tener Ausencia.hasMany, pero como la db es relacional,
    // con este belongsTo ya nos sirve para consultar desde Ausencia o con include.
  }

  return Ausencia
}
