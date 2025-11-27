const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

// Importar rutas
const authRoutes = require("./routes/auth")
const pacienteRoutes = require("./routes/pacientes")
const turnoRoutes = require("./routes/turnos")
const profesionalRoutes = require("./routes/profesionales")
const servicioRoutes = require("./routes/servicios")
const configuracionRoutes = require("./routes/configuracion")
const odontogramaRoutes = require("./routes/odontogramas")
const historialClinicoRoutes = require("./routes/historiales-clinicos")
const prescripcionRoutes = require("./routes/prescripciones")
const planTratamientoRoutes = require("./routes/planes-tratamiento")
const archivoRoutes = require("./routes/archivos")
const prestacionRoutes = require("./routes/prestaciones")
const liquidacionRoutes = require("./routes/liquidaciones")

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
)
// Middlewares de seguridad
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por ventana de tiempo
})
app.use("/api/", limiter)

// Middlewares de parsing
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Servir archivos estáticos
app.use("/uploads", express.static("src/uploads"))

// Rutas de la API
app.use("/api/auth", authRoutes)
app.use("/api/pacientes", pacienteRoutes)
app.use("/api/turnos", turnoRoutes)
app.use("/api/profesionales", profesionalRoutes)
app.use("/api/servicios", servicioRoutes)
app.use("/api/configuracion", configuracionRoutes)
app.use("/api/odontogramas", odontogramaRoutes)
app.use("/api/historiales-clinicos", historialClinicoRoutes)
app.use("/api/prescripciones", prescripcionRoutes)
app.use("/api/planes-tratamiento", planTratamientoRoutes)
app.use("/api/archivos", archivoRoutes)
app.use("/api/prestaciones", prestacionRoutes)
app.use("/api/liquidaciones", liquidacionRoutes)
app.use("/api/obras-sociales", require("./routes/obras-sociales"))
app.use("/api/copagos", require("./routes/copagos"))

// Ruta de salud
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

// Manejo de errores 404
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint no encontrado" })
})

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error("Error:", error)
  res.status(error.status || 500).json({
    error: error.message || "Error interno del servidor",
    stack: error.stack, // Removed the conditional check for NODE_ENV
  })
})

module.exports = app
