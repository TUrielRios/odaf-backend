module.exports = (sequelize, DataTypes) => {
  const Profesional = sequelize.define(
    "Profesional",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      apellido: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      numero_documento: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      numero_matricula: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      especialidad: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      telefono: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
        validate: {
          isEmail: true,
        },
      },
      direccion: {
        type: DataTypes.STRING,
      },
      horarios_atencion: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: "Horarios de atención por día de la semana",
      },
      estado: {
        type: DataTypes.ENUM("Activo", "Inactivo", "Suspendido"),
        defaultValue: "Activo",
      },
      observaciones: {
        type: DataTypes.TEXT,
      },
      porcentaje_comision: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 50.0,
        validate: {
          min: 0,
          max: 100,
        },
        comment: "Porcentaje de comisión que recibe el profesional por defecto (0-100)",
      },
      color: {
        type: DataTypes.STRING,
        defaultValue: "#026498",
        comment: "Color identificativo del profesional en el calendario",
      },
    },
    {
      tableName: "profesionales",
      timestamps: true,
    },
  )

  Profesional.associate = (models) => {
    Profesional.hasMany(models.Turno, {
      foreignKey: "profesional_id",
      as: "turnos",
    })

    Profesional.hasMany(models.Odontograma, {
      foreignKey: "profesional_id",
      as: "odontogramas",
    })

    Profesional.hasMany(models.HistorialClinico, {
      foreignKey: "profesional_id",
      as: "historialesClinico",
    })

    Profesional.hasMany(models.Prescripcion, {
      foreignKey: "profesional_id",
      as: "prescripciones",
    })

    Profesional.hasMany(models.PlanTratamiento, {
      foreignKey: "profesional_id",
      as: "planesTratamiento",
    })

    Profesional.hasMany(models.Archivo, {
      foreignKey: "profesional_id",
      as: "archivos",
    })

    Profesional.hasMany(models.Prestacion, {
      foreignKey: "profesional_id",
      as: "prestaciones",
    })

    Profesional.belongsToMany(models.Servicio, {
      through: models.ProfesionalServicio,
      foreignKey: "profesional_id",
      otherKey: "servicio_id",
      as: "servicios",
    })

    Profesional.hasMany(models.ProfesionalServicio, {
      foreignKey: "profesional_id",
      as: "profesionalServicios",
    })
  }

  return Profesional
}
