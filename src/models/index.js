const { Sequelize } = require("sequelize")
const config = require("../config/database")

const env = process.env.NODE_ENV || "development"
const dbConfig = config[env]

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig)

// Importar modelos
const Paciente = require("./paciente")(sequelize, Sequelize.DataTypes)
const ObraSocial = require("./obraSocial")(sequelize, Sequelize.DataTypes)
const Odontograma = require("./odontograma")(sequelize, Sequelize.DataTypes)
const HistorialClinico = require("./historialClinico")(sequelize, Sequelize.DataTypes)
const Prescripcion = require("./prescripcion")(sequelize, Sequelize.DataTypes)
const PlanTratamiento = require("./planTratamiento")(sequelize, Sequelize.DataTypes)
const Archivo = require("./archivo")(sequelize, Sequelize.DataTypes)
const Profesional = require("./profesional")(sequelize, Sequelize.DataTypes)
const Servicio = require("./servicio")(sequelize, Sequelize.DataTypes)
const SubServicio = require("./subServicio")(sequelize, Sequelize.DataTypes)
const Turno = require("./turno")(sequelize, Sequelize.DataTypes)
const ConfiguracionSistema = require("./configuracionSistema")(sequelize, Sequelize.DataTypes)

// Definir asociaciones
const models = {
  Paciente,
  ObraSocial,
  Odontograma,
  HistorialClinico,
  Prescripcion,
  PlanTratamiento,
  Archivo,
  Profesional,
  Servicio,
  SubServicio,
  Turno,
  ConfiguracionSistema,
}

// Configurar asociaciones
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models)
  }
})

module.exports = {
  sequelize,
  Sequelize,
  ...models,
}
