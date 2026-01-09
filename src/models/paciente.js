const { v4: uuidv4 } = require("uuid")

module.exports = (sequelize, DataTypes) => {
  const Paciente = sequelize.define(
    "Paciente",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
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
      tipo_documento: {
        type: DataTypes.ENUM("DNI", "Pasaporte", "Cédula"),
        allowNull: false,
      },
      numero_documento: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      obra_social_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "ObrasSociales",
          key: "id",
        },
      },
      condicion: {
        type: DataTypes.STRING,
        defaultValue: "Activo",
      },
      fecha_nacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: true,
          isBefore: new Date().toISOString(),
        },
      },
      sexo: {
        type: DataTypes.ENUM("Masculino", "Femenino", "Otro"),
        allowNull: false,
      },
      direccion: {
        type: DataTypes.STRING,
      },
      ocupacion: {
        type: DataTypes.STRING,
      },
      recomendado_por: {
        type: DataTypes.STRING,
      },
      tipo_facturacion: {
        type: DataTypes.ENUM("A", "B", "C"),
        defaultValue: "B",
      },
      numero_facturacion: {
        type: DataTypes.STRING,
      },
      etiquetas: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      email: {
        type: DataTypes.STRING,
        validate: {
          isEmail: true,
        },
      },
      telefono: {
        type: DataTypes.STRING,
        validate: {
          len: [0, 50],
        },
      },
      informacion_adicional: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "pacientes",
      timestamps: true,
    },
  )

  Paciente.associate = (models) => {
    Paciente.belongsTo(models.ObraSocial, {
      foreignKey: "obra_social_id",
      as: "obraSocial",
    })

    Paciente.hasMany(models.Odontograma, {
      foreignKey: "paciente_id",
      as: "odontogramas",
    })

    Paciente.hasMany(models.HistorialClinico, {
      foreignKey: "paciente_id",
      as: "historialClinico",
    })

    Paciente.hasMany(models.Prescripcion, {
      foreignKey: "paciente_id",
      as: "prescripciones",
    })

    Paciente.hasMany(models.PlanTratamiento, {
      foreignKey: "paciente_id",
      as: "planesTratamiento",
    })

    Paciente.hasMany(models.Archivo, {
      foreignKey: "paciente_id",
      as: "archivos",
    })

    Paciente.hasMany(models.Turno, {
      foreignKey: "paciente_id",
      as: "turnos",
    })
  }

  return Paciente
}
