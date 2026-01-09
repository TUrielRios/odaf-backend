module.exports = (sequelize, DataTypes) => {
    const MovimientoCuenta = sequelize.define(
        "MovimientoCuenta",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            paciente_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: "pacientes",
                    key: "id",
                },
            },
            fecha: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            tipo: {
                type: DataTypes.ENUM("Ingreso", "Deuda", "Egreso"),
                allowNull: false,
            },
            monto: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    min: 0,
                },
            },
            forma_pago: {
                type: DataTypes.STRING,
                allowNull: true, // Only for "Ingreso" usually
                comment: "Efectivo, Tarjeta, Transferencia, etc.",
            },
            descripcion: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: "Información adicional o notas",
            },
        },
        {
            tableName: "movimientos_cuenta",
            timestamps: true,
        }
    )

    MovimientoCuenta.associate = (models) => {
        MovimientoCuenta.belongsTo(models.Paciente, {
            foreignKey: "paciente_id",
            as: "paciente",
        })
    }

    return MovimientoCuenta
}
