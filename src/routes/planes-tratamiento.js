const express = require("express")
const { body } = require("express-validator")
const planTratamientoController = require("../controllers/planTratamientoController")
const authMiddleware = require("../middlewares/auth")

const router = express.Router()

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware)

// Validaciones
const validacionCrearPlan = [
  body("paciente_id").notEmpty().withMessage("El ID del paciente es requerido"),
  body("profesional_id").isInt().withMessage("El ID del profesional debe ser un número entero"),
  body("tratamientos").isArray().withMessage("Los tratamientos deben ser un array"),
  body("costo_total").isDecimal().withMessage("El costo total debe ser un número decimal"),
]

const validacionActualizarPlan = [
  body("tratamientos").optional().isArray().withMessage("Los tratamientos deben ser un array"),
  body("costo_total").optional().isDecimal().withMessage("El costo total debe ser un número decimal"),
  body("estado")
    .optional()
    .isIn(["Pendiente", "En_Progreso", "Completado", "Cancelado"])
    .withMessage("Estado inválido"),
]

// Rutas
router.get("/", planTratamientoController.listarPlanesTratamiento)
router.post("/", validacionCrearPlan, planTratamientoController.crearPlanTratamiento)
router.get("/:id", planTratamientoController.obtenerPlanTratamiento)
router.put("/:id", validacionActualizarPlan, planTratamientoController.actualizarPlanTratamiento)
router.delete("/:id", planTratamientoController.eliminarPlanTratamiento)

module.exports = router
