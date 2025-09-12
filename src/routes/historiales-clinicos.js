const express = require("express")
const { body } = require("express-validator")
const historialClinicoController = require("../controllers/historialClinicoController")
const authMiddleware = require("../middlewares/auth")

const router = express.Router()

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware)

// Validaciones
const validacionCrearHistorial = [
  body("paciente_id").notEmpty().withMessage("El ID del paciente es requerido"),
  body("profesional_id").isInt().withMessage("El ID del profesional debe ser un número entero"),
  body("fecha").isDate().withMessage("La fecha debe ser válida"),
  body("motivo_consulta").notEmpty().withMessage("El motivo de consulta es requerido"),
]

const validacionActualizarHistorial = [
  body("fecha").optional().isDate().withMessage("La fecha debe ser válida"),
  body("motivo_consulta").optional().notEmpty().withMessage("El motivo de consulta no puede estar vacío"),
]

// Rutas
router.get("/", historialClinicoController.listarHistorialesClinico)
router.post("/", validacionCrearHistorial, historialClinicoController.crearHistorialClinico)
router.get("/:id", historialClinicoController.obtenerHistorialClinico)
router.put("/:id", validacionActualizarHistorial, historialClinicoController.actualizarHistorialClinico)
router.delete("/:id", historialClinicoController.eliminarHistorialClinico)

module.exports = router
