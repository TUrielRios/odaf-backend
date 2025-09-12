module.exports = (sequelize, DataTypes) => {
  const Archivo = sequelize.define(
    "Archivo",
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
        references: {
          model: "profesionales",
          key: "id",
        },
      },
      nombre_original: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      nombre_archivo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      ruta_archivo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tipo_mime: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tamaño: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      categoria: {
        type: DataTypes.ENUM("Radiografia", "Foto", "Documento", "Laboratorio", "Otro"),
        defaultValue: "Otro",
      },
      descripcion: {
        type: DataTypes.TEXT,
      },
      fecha_subida: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "archivos",
      timestamps: true,
    },
  )

  Archivo.associate = (models) => {
    Archivo.belongsTo(models.Paciente, {
      foreignKey: "paciente_id",
      as: "paciente",
    })

    Archivo.belongsTo(models.Profesional, {
      foreignKey: "profesional_id",
      as: "profesional",
    })
  }

  return Archivo
}
