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
  body("fecha").isDate().withMessage("La fecha debe ser válida (YYYY-MM-DD)"),
  body("hora_inicio").matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("La hora de inicio debe tener formato HH:MM"),
  body("hora_fin").matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("La hora de fin debe tener formato HH:MM"),
]

const validacionActualizarTurno = [
  body("fecha_hora").optional().isISO8601().withMessage("La fecha y hora deben ser válidas"),
  body("duracion_minutos")
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage("La duración debe estar entre 15 y 480 minutos"),
  body("estado")
    .optional()
    .isIn([
      "Pendiente",
      "Confirmado",
      "Completado",
      "Cancelado",
      "Creado",
      "Esperando confirmación",
      "Confirmado por email",
      "Confirmado por SMS",
      "Confirmado por Whatsapp",
      "En sala de espera",
      "Atendiéndose",
      "Atendido",
      "Ausente"
    ])
    .withMessage("Estado inválido"),
]

// Rutas
router.get("/", turnoController.listarTurnos)
router.post("/", validacionCrearTurno, turnoController.crearTurno)
router.get("/:id", turnoController.obtenerTurno)
router.put("/:id", validacionActualizarTurno, turnoController.actualizarTurno)
router.put("/:id/confirmar-pago", turnoController.confirmarPago)
router.delete("/:id", turnoController.eliminarTurno)
router.get("/disponibilidad/:profesional_id", turnoController.verificarDisponibilidad)

module.exports = router
