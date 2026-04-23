module.exports = (sequelize, DataTypes) => {
  const Feriado = sequelize.define(
    "Feriado",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true,
      },
      descripcion: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: "feriados",
      timestamps: true,
    },
  )

  return Feriado
}
