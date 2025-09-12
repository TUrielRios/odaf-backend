const express = require("express")
const { body } = require("express-validator")
const profesionalController = require("../controllers/profesionalController")
const authMiddleware = require("../middlewares/auth")

const router = express.Router()

// Aplicar middleware de autenticación a todas las rutas
//router.use(authMiddleware)

// Validaciones
const validacionCrearProfesional = [
  body("apellido").notEmpty().withMessage("El apellido es requerido"),
  body("nombre").notEmpty().withMessage("El nombre es requerido"),
  body("email").isEmail().withMessage("Email inválido"),
  body("telefono").notEmpty().withMessage("El teléfono es requerido"),
  body("especialidad").notEmpty().withMessage("La especialidad es requerida"),
  body("numero_matricula").notEmpty().withMessage("El número de matrícula es requerido"),
]

const validacionActualizarProfesional = [
  body("apellido").optional().notEmpty().withMessage("El apellido no puede estar vacío"),
  body("nombre").optional().notEmpty().withMessage("El nombre no puede estar vacío"),
  body("email").optional().isEmail().withMessage("Email inválido"),
  body("telefono").optional().notEmpty().withMessage("El teléfono no puede estar vacío"),
  body("especialidad").optional().notEmpty().withMessage("La especialidad no puede estar vacía"),
  body("numero_matricula").optional().notEmpty().withMessage("El número de matrícula no puede estar vacío"),
  body("activo").optional().isBoolean().withMessage("El estado activo debe ser verdadero o falso"),
]

// Rutas
router.get("/", profesionalController.listarProfesionales)
router.post("/", validacionCrearProfesional, profesionalController.crearProfesional)
router.get("/:id", profesionalController.obtenerProfesional)
router.put("/:id", validacionActualizarProfesional, profesionalController.actualizarProfesional)
router.delete("/:id", profesionalController.eliminarProfesional)
router.get("/:id/horarios", profesionalController.obtenerHorariosProfesional)

module.exports = router
