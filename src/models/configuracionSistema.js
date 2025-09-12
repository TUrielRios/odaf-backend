module.exports = (sequelize, DataTypes) => {
  const ConfiguracionSistema = sequelize.define(
    "ConfiguracionSistema",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      clave: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      valor: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      tipo: {
        type: DataTypes.ENUM("string", "number", "boolean", "json"),
        defaultValue: "string",
      },
      descripcion: {
        type: DataTypes.TEXT,
      },
      categoria: {
        type: DataTypes.STRING,
        defaultValue: "general",
      },
    },
    {
      tableName: "configuracion_sistema",
      timestamps: true,
    },
  )

  return ConfiguracionSistema
}
