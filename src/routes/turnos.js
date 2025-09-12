const express = require("express")
const { body } = require("express-validator")
const turnoController = require("../controllers/turnoController")
const authMiddleware = require("../middlewares/auth")

const router = express.Router()

// Aplicar middleware de autenticación a todas las rutas
//router.use(authMiddleware)

// Validaciones
const validacionCrearTurno = [
  body("paciente_id").notEmpty().withMessage("El ID del paciente es requerido"),
  body("profesional_id").isInt().withMessage("El ID del profesional debe ser un número entero"),
  body("servicio_id").isInt().withMessage("El ID del servicio debe ser un número entero"),
  body("fecha_hora").isISO8601().withMessage("La fecha y hora deben ser válidas"),
  body("duracion_minutos").isInt({ min: 15, max: 480 }).withMessage("La duración debe estar entre 15 y 480 minutos"),
]

const validacionActualizarTurno = [
  body("fecha_hora").optional().isISO8601().withMessage("La fecha y hora deben ser válidas"),
  body("duracion_minutos")
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage("La duración debe estar entre 15 y 480 minutos"),
  body("estado")
    .optional()
    .isIn(["Programado", "Confirmado", "En_Curso", "Completado", "Cancelado", "No_Asistio"])
    .withMessage("Estado inválido"),
]

// Rutas
router.get("/", turnoController.listarTurnos)
router.post("/", validacionCrearTurno, turnoController.crearTurno)
router.get("/:id", turnoController.obtenerTurno)
router.put("/:id", validacionActualizarTurno, turnoController.actualizarTurno)
router.delete("/:id", turnoController.eliminarTurno)
router.get("/disponibilidad/:profesional_id", turnoController.verificarDisponibilidad)

module.exports = router
