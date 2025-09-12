module.exports = (sequelize, DataTypes) => {
  const SubServicio = sequelize.define(
    "SubServicio",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      servicio_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "servicios",
          key: "id",
        },
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
      precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      duracion_estimada: {
        type: DataTypes.INTEGER,
        comment: "Duración en minutos",
        defaultValue: 30,
      },
      estado: {
        type: DataTypes.ENUM("Activo", "Inactivo"),
        defaultValue: "Activo",
      },
    },
    {
      tableName: "sub_servicios",
      timestamps: true,
    },
  )

  SubServicio.associate = (models) => {
    SubServicio.belongsTo(models.Servicio, {
      foreignKey: "servicio_id",
      as: "servicio",
    })

    SubServicio.hasMany(models.Turno, {
      foreignKey: "subservicio_id",
      as: "turnos",
    })
  }

  return SubServicio
}
