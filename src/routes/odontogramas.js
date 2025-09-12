const express = require("express")
const { body } = require("express-validator")
const odontogramaController = require("../controllers/odontogramaController")
const authMiddleware = require("../middlewares/auth")

const router = express.Router()

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware)

// Validaciones
const validacionCrearOdontograma = [
  body("paciente_id").notEmpty().withMessage("El ID del paciente es requerido"),
  body("profesional_id").isInt().withMessage("El ID del profesional debe ser un número entero"),
  body("fecha").isDate().withMessage("La fecha debe ser válida"),
  body("dientes_data").isObject().withMessage("Los datos de dientes deben ser un objeto"),
  body("tipo").isIn(["Inicial", "Control", "Tratamiento"]).withMessage("Tipo de odontograma inválido"),
]

const validacionActualizarOdontograma = [
  body("fecha").optional().isDate().withMessage("La fecha debe ser válida"),
  body("dientes_data").optional().isObject().withMessage("Los datos de dientes deben ser un objeto"),
  body("tipo").optional().isIn(["Inicial", "Control", "Tratamiento"]).withMessage("Tipo de odontograma inválido"),
]

// Rutas
router.get("/", odontogramaController.listarOdontogramas)
router.post("/", validacionCrearOdontograma, odontogramaController.crearOdontograma)
router.get("/:id", odontogramaController.obtenerOdontograma)
router.put("/:id", validacionActualizarOdontograma, odontogramaController.actualizarOdontograma)
router.delete("/:id", odontogramaController.eliminarOdontograma)

module.exports = router
