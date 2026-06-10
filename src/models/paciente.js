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
          notEmpty: {
            msg: "El apellido es requerido",
          },
          len: {
            args: [1, 100],
            msg: "El apellido debe tener entre 1 y 100 caracteres",
          },
        },
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "El nombre es requerido",
          },
          len: {
            args: [1, 100],
            msg: "El nombre debe tener entre 1 y 100 caracteres",
          },
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
        allowNull: true,
        set(value) {
          this.setDataValue('fecha_nacimiento', value === '' ? null : value)
        }
      },
      sexo: {
        type: DataTypes.ENUM("Masculino", "Femenino", "Otro"),
        allowNull: true,
        set(value) {
          this.setDataValue('sexo', value === '' ? null : value)
        }
      },
      direccion: {
        type: DataTypes.STRING,
        set(value) {
          this.setDataValue('direccion', value === '' ? null : value)
        }
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
        allowNull: true,
        set(value) {
          this.setDataValue('email', value === '' ? null : value)
        },
        validate: {
          isEmail: true,
        },
      },
      telefono: {
        type: DataTypes.STRING,
        allowNull: true,
        set(value) {
          this.setDataValue('telefono', value === '' ? null : value)
        },
        validate: {
          len: [0, 50],
        },
      },
      numero_afiliado: {
        type: DataTypes.STRING,
      },
      condicion_iva: {
        type: DataTypes.STRING,
      },
      foto_url: {
        type: DataTypes.STRING,
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

    Paciente.hasMany(models.Presupuesto, {
      foreignKey: "paciente_id",
      as: "presupuestos",
    })
  }

  return Paciente
}
