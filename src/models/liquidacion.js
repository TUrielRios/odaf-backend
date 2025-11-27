module.exports = (sequelize, DataTypes) => {
  const Liquidacion = sequelize.define(
    "Liquidacion",
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
      periodo_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: "Fecha de inicio del período de liquidación",
      },
      periodo_fin: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: "Fecha de fin del período de liquidación",
      },
      monto_total_servicios: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
        comment: "Monto total de servicios prestados en el período",
      },
      monto_profesional: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
        comment: "Monto total a pagar al profesional",
      },
      cantidad_prestaciones: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
        comment: "Cantidad de prestaciones incluidas en la liquidación",
      },
      estado: {
        type: DataTypes.ENUM("Borrador", "Generada", "Pagada", "Anulada"),
        defaultValue: "Borrador",
      },
      fecha_pago: {
        type: DataTypes.DATEONLY,
        comment: "Fecha en que se realizó el pago",
      },
      metodo_pago: {
        type: DataTypes.STRING,
        comment: "Método de pago utilizado (Efectivo, Transferencia, Cheque, etc.)",
      },
      observaciones: {
        type: DataTypes.TEXT,
      },
      detalles: {
        type: DataTypes.JSON,
        comment: "Detalles adicionales de la liquidación (descuentos, bonificaciones, etc.)",
      },
    },
    {
      tableName: "liquidaciones",
      timestamps: true,
      validate: {
        periodoValido() {
          if (this.periodo_fin < this.periodo_inicio) {
            throw new Error("La fecha de fin debe ser mayor o igual que la fecha de inicio")
          }
        },
      },
    },
  )

  Liquidacion.associate = (models) => {
    Liquidacion.belongsTo(models.Profesional, {
      foreignKey: "profesional_id",
      as: "profesional",
    })

    Liquidacion.hasMany(models.Prestacion, {
      foreignKey: "liquidacion_id",
      as: "prestaciones",
    })
  }

  return Liquidacion
}
