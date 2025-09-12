const express = require("express")
const { body } = require("express-validator")
const {
  listarPacientes,
  crearPaciente,
  obtenerPaciente,
  actualizarPaciente,
  eliminarPaciente,
} = require("../controllers/pacienteController")
const auth = require("../middlewares/auth")

const router = express.Router()

// Validaciones para paciente
const pacienteValidation = [
  body("apellido").notEmpty().withMessage("El apellido es requerido"),
  body("nombre").notEmpty().withMessage("El nombre es requerido"),
  body("tipo_documento").isIn(["DNI", "Pasaporte", "Cédula"]).withMessage("Tipo de documento inválido"),
  body("numero_documento").notEmpty().withMessage("El número de documento es requerido"),
  body("fecha_nacimiento").isDate().withMessage("Fecha de nacimiento inválida"),
  body("sexo").isIn(["Masculino", "Femenino", "Otro"]).withMessage("Sexo inválido"),
]

// Aplicar autenticación a todas las rutas
router.use(auth)

// Rutas
router.get("/", listarPacientes)
router.post("/", pacienteValidation, crearPaciente)
router.get("/:id", obtenerPaciente)
router.put("/:id", pacienteValidation, actualizarPaciente)
router.delete("/:id", eliminarPaciente)

module.exports = router
