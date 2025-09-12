module.exports = (sequelize, DataTypes) => {
  const Servicio = sequelize.define(
    "Servicio",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      descripcion: {
        type: DataTypes.TEXT,
      },
      precio_base: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      duracion_estimada: {
        type: DataTypes.INTEGER,
        comment: "Duración en minutos",
        defaultValue: 30,
      },
      categoria: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      estado: {
        type: DataTypes.ENUM("Activo", "Inactivo"),
        defaultValue: "Activo",
      },
      requiere_autorizacion: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "servicios",
      timestamps: true,
    },
  )

  Servicio.associate = (models) => {
    Servicio.hasMany(models.SubServicio, {
      foreignKey: "servicio_id",
      as: "subServicios",
    })

    Servicio.hasMany(models.Turno, {
      foreignKey: "servicio_id",
      as: "turnos",
    })
  }

  return Servicio
}
