require("dotenv").config()

function getDatabaseConfig() {
  // Si existe DATABASE_URL (Railway, Heroku, etc.), parsearla
  if (process.env.DATABASE_URL) {
    return {
      use_env_variable: "DATABASE_URL",
      dialect: "postgres",
      dialectOptions: {
        ssl:
          process.env.NODE_ENV === "production"
            ? {
              require: true,
              rejectUnauthorized: false,
            }
            : false,
      },
      logging: process.env.NODE_ENV === "production" ? false : console.log,
      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000,
      },
    }
  }

  // Si no existe DATABASE_URL, usar variables individuales
  return {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "production" ? false : console.log,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  }
}

module.exports = {
  development: {
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "dental_clinic_dev",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  production: getDatabaseConfig(),
}
