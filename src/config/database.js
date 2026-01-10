require("dotenv").config()

function getDatabaseConfig() {
  console.log("[v0] NODE_ENV:", process.env.NODE_ENV)
  console.log("[v0] DATABASE_URL existe:", !!process.env.DATABASE_URL)
  console.log(
    "[v0] DATABASE_URL (primeros 20 chars):",
    process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + "..." : "no definida",
  )

  // Si existe DATABASE_URL (Railway, Heroku, etc.), parsearla
  if (process.env.DATABASE_URL) {
    const config = {
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
    console.log("[v0] Usando DATABASE_URL con SSL:", !!config.dialectOptions.ssl)
    return config
  }

  // Si no existe DATABASE_URL, usar variables individuales
  console.log("[v0] Usando variables individuales:")
  console.log("[v0] DB_HOST:", process.env.DB_HOST)
  console.log("[v0] DB_PORT:", process.env.DB_PORT)
  console.log("[v0] DB_NAME:", process.env.DB_NAME)
  console.log("[v0] DB_USER:", process.env.DB_USER)

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
