module.exports = (sequelize, DataTypes) => {
  const UsuarioAdmin = sequelize.define(
    "UsuarioAdmin",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("admin", "profesional"),
        allowNull: false,
        defaultValue: "profesional",
      },
      profesional_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      permisos_tabs: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: "Pestañas visibles para el profesional. null = todas las disponibles para su rol",
      },
    },
    {
      tableName: "usuarios_admin",
      timestamps: true,
    },
  )

  UsuarioAdmin.associate = (models) => {
    UsuarioAdmin.belongsTo(models.Profesional, {
      foreignKey: "profesional_id",
      as: "profesional",
    })
  }

  return UsuarioAdmin
}
