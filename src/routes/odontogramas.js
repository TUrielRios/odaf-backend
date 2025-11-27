const express = require("express")
const { body, param } = require("express-validator")
const odontogramaController = require("../controllers/odontogramaController")
const authMiddleware = require("../middlewares/auth")

const router = express.Router()

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware)

// Validaciones mejoradas
const validacionCrearOdontograma = [
  body("paciente_id")
    .notEmpty().withMessage("El ID del paciente es requerido")
    .isUUID().withMessage("El ID del paciente debe ser un UUID válido"),
  body("profesional_id")
    .notEmpty().withMessage("El ID del profesional es requerido")
    .isInt({ min: 1 }).withMessage("El ID del profesional debe ser un número entero positivo"),
  body("fecha")
    .optional()
    .isDate().withMessage("La fecha debe ser válida"),
  body("dientes_data")
    .optional()
    .isObject().withMessage("Los datos de dientes deben ser un objeto"),
  body("tipo")
    .optional()
    .isIn(["Inicial", "Control", "Tratamiento"]).withMessage("Tipo de odontograma inválido"),
  body("observaciones")
    .optional()
    .isString().withMessage("Las observaciones deben ser texto")
]

const validacionActualizarOdontograma = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID debe ser un número entero positivo"),
  body("fecha")
    .optional()
    .isDate().withMessage("La fecha debe ser válida"),
  body("dientes_data")
    .optional()
    .isObject().withMessage("Los datos de dientes deben ser un objeto"),
  body("tipo")
    .optional()
    .isIn(["Inicial", "Control", "Tratamiento"]).withMessage("Tipo de odontograma inválido"),
  body("observaciones")
    .optional()
    .isString().withMessage("Las observaciones deben ser texto"),
  body("paciente_id")
    .optional()
    .isUUID().withMessage("El ID del paciente debe ser un UUID válido"),
  body("profesional_id")
    .optional()
    .isInt({ min: 1 }).withMessage("El ID del profesional debe ser un número entero positivo")
]

const validacionIdParam = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID debe ser un número entero positivo")
]

// Rutas principales
router.get("/", odontogramaController.listarOdontogramas)
router.get("/inicializar", odontogramaController.inicializarOdontograma)
router.post("/", validacionCrearOdontograma, odontogramaController.crearOdontograma)
router.get("/:id", validacionIdParam, odontogramaController.obtenerOdontograma)
router.get("/:id/estadisticas", validacionIdParam, odontogramaController.obtenerEstadisticas)
router.put("/:id", validacionActualizarOdontograma, odontogramaController.actualizarOdontograma)
router.delete("/:id", validacionIdParam, odontogramaController.eliminarOdontograma)

module.exports = router