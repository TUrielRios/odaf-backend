module.exports = (sequelize, DataTypes) => {
  const Prestacion = sequelize.define(
    "Prestacion",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      profesional_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "profesionales",
          key: "id",
        },
      },
      paciente_id: {
        type: DataTypes.UUID,
        references: {
          model: "pacientes",
          key: "id",
        },
      },
      servicio_id: {
        type: DataTypes.INTEGER,
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
      turno_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "turnos",
          key: "id",
        },
        comment: "Referencia al turno asociado si existe",
      },
      liquidacion_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "liquidaciones",
          key: "id",
        },
        comment: "Referencia a la liquidación que incluye esta prestación",
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      descripcion: {
        type: DataTypes.TEXT,
        comment: "Descripción del servicio prestado",
      },
      monto_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
        comment: "Monto total del servicio",
      },
      porcentaje_profesional: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 50.0,
        validate: {
          min: 0,
          max: 100,
        },
        comment: "Porcentaje que recibe el profesional (0-100)",
      },
      monto_profesional: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
        comment: "Monto calculado para el profesional",
      },
      estado: {
        type: DataTypes.ENUM("Pendiente", "Liquidado", "Pagado"),
        defaultValue: "Pendiente",
      },
      fecha_liquidacion: {
        type: DataTypes.DATEONLY,
        comment: "Fecha en que se liquidó el pago",
      },
      fecha_pago: {
        type: DataTypes.DATEONLY,
        comment: "Fecha en que se pagó al profesional",
      },
      observaciones: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "prestaciones",
      timestamps: true,
      hooks: {
        beforeValidate: (prestacion) => {
          // Calcular automáticamente el monto del profesional
          if (prestacion.monto_total && prestacion.porcentaje_profesional) {
            prestacion.monto_profesional = ((prestacion.monto_total * prestacion.porcentaje_profesional) / 100).toFixed(
              2,
            )
          }
        },
      },
    },
  )

  Prestacion.associate = (models) => {
    Prestacion.belongsTo(models.Profesional, {
      foreignKey: "profesional_id",
      as: "profesional",
    })

    Prestacion.belongsTo(models.Paciente, {
      foreignKey: "paciente_id",
      as: "paciente",
    })

    Prestacion.belongsTo(models.Servicio, {
      foreignKey: "servicio_id",
      as: "servicio",
    })

    Prestacion.belongsTo(models.SubServicio, {
      foreignKey: "subservicio_id",
      as: "subservicio",
    })

    Prestacion.belongsTo(models.Turno, {
      foreignKey: "turno_id",
      as: "turno",
    })

    Prestacion.belongsTo(models.Liquidacion, {
      foreignKey: "liquidacion_id",
      as: "liquidacion",
    })
  }

  return Prestacion
}
