module.exports = (sequelize, DataTypes) => {
  const Turno = sequelize.define(
    "Turno",
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
        allowNull: false,
        references: {
          model: "profesionales",
          key: "id",
        },
      },
      observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pago_confirmado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      servicio_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "servicios",
          key: "id",
        },
      },
      subservicio_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "sub_servicios",
          key: "id",
        },
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: true,
        },
      },
      hora_inicio: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      hora_fin: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      estado: {
        type: DataTypes.ENUM("Pendiente", "Confirmado", "Completado", "Cancelado"),
        defaultValue: "Pendiente",
      },
      notas: {
        type: DataTypes.TEXT,
      },
      recordatorio_enviado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "turnos",
      timestamps: true,
      validate: {
        horaFinMayorQueInicio() {
          if (this.hora_fin <= this.hora_inicio) {
            throw new Error("La hora de fin debe ser mayor que la hora de inicio")
          }
        },
      },
    },
  )

  Turno.associate = (models) => {
    Turno.belongsTo(models.Paciente, {
      foreignKey: "paciente_id",
      as: "paciente",
    })

    Turno.belongsTo(models.Profesional, {
      foreignKey: "profesional_id",
      as: "profesional",
    })

    Turno.belongsTo(models.Servicio, {
      foreignKey: "servicio_id",
      as: "servicio",
    })

    Turno.belongsTo(models.SubServicio, {
      foreignKey: "subservicio_id",
      as: "subservicio",
    })

    Turno.hasMany(models.Prestacion, {
      foreignKey: "turno_id",
      as: "prestaciones",
    })
  }

  return Turno
}
