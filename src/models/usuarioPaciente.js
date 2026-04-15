const { v4: uuidv4 } = require("uuid")

module.exports = (sequelize, DataTypes) => {
  const UsuarioPaciente = sequelize.define(
    "UsuarioPaciente",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      dni_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      paciente_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "pacientes",
          key: "id",
        },
      },
    },
    {
      tableName: "usuarios_pacientes",
      timestamps: true,
    },
  )

  UsuarioPaciente.associate = (models) => {
    UsuarioPaciente.belongsTo(models.Paciente, {
      foreignKey: "paciente_id",
      as: "paciente",
    })
  }

  return UsuarioPaciente
}
