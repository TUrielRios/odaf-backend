const express = require("express")
const { body } = require("express-validator")
const planTratamientoController = require("../controllers/planTratamientoController")
const authMiddleware = require("../middlewares/auth")

const router = express.Router()

// Aplicar middleware de autenticación a todas las rutas
//router.use(authMiddleware)

// Validaciones
const validacionCrearPlan = [
  body("paciente_id").notEmpty().withMessage("El ID del paciente es requerido"),
  body("descripcion").notEmpty().withMessage("La descripción es requerida"),
  body("estado")
    .optional()
    .isIn(["Planificado", "Pendiente", "En_Progreso", "Completado", "Cancelado"])
    .withMessage("Estado inválido"),
]

const validacionActualizarPlan = [
  body("estado")
    .optional()
    .isIn(["Planificado", "Pendiente", "En_Progreso", "Completado", "Cancelado"])
    .withMessage("Estado inválido"),
]

// Rutas
router.get("/", planTratamientoController.listarPlanesTratamiento)
router.post("/", validacionCrearPlan, planTratamientoController.crearPlanTratamiento)
router.get("/:id", planTratamientoController.obtenerPlanTratamiento)
router.put("/:id", validacionActualizarPlan, planTratamientoController.actualizarPlanTratamiento)
router.delete("/:id", planTratamientoController.eliminarPlanTratamiento)

module.exports = router
