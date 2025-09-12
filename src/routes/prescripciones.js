const express = require("express")
const { body } = require("express-validator")
const prescripcionController = require("../controllers/prescripcionController")
const authMiddleware = require("../middlewares/auth")

const router = express.Router()

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware)

// Validaciones
const validacionCrearPrescripcion = [
  body("paciente_id").notEmpty().withMessage("El ID del paciente es requerido"),
  body("profesional_id").isInt().withMessage("El ID del profesional debe ser un número entero"),
  body("fecha").isDate().withMessage("La fecha debe ser válida"),
  body("medicamentos").isArray().withMessage("Los medicamentos deben ser un array"),
]

const validacionActualizarPrescripcion = [
  body("fecha").optional().isDate().withMessage("La fecha debe ser válida"),
  body("medicamentos").optional().isArray().withMessage("Los medicamentos deben ser un array"),
  body("estado").optional().isIn(["Activa", "Completada", "Cancelada"]).withMessage("Estado inválido"),
]

// Rutas
router.get("/", prescripcionController.listarPrescripciones)
router.post("/", validacionCrearPrescripcion, prescripcionController.crearPrescripcion)
router.get("/:id", prescripcionController.obtenerPrescripcion)
router.put("/:id", validacionActualizarPrescripcion, prescripcionController.actualizarPrescripcion)
router.delete("/:id", prescripcionController.eliminarPrescripcion)

module.exports = router
