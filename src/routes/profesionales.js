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

const validacionActualizarHorarios = [
  body("horarios").isObject().withMessage("Los horarios deben ser un objeto"),
  body("horarios.lunes").optional().isObject().withMessage("Horario de lunes debe ser un objeto"),
  body("horarios.martes").optional().isObject().withMessage("Horario de martes debe ser un objeto"),
  body("horarios.miercoles").optional().isObject().withMessage("Horario de miércoles debe ser un objeto"),
  body("horarios.jueves").optional().isObject().withMessage("Horario de jueves debe ser un objeto"),
  body("horarios.viernes").optional().isObject().withMessage("Horario de viernes debe ser un objeto"),
  body("horarios.sabado").optional().isObject().withMessage("Horario de sábado debe ser un objeto"),
  body("horarios.domingo").optional().isObject().withMessage("Horario de domingo debe ser un objeto"),
  // Validación flexible: acepta tanto formato antiguo (inicio/fin) como nuevo (rangos)
  body("horarios.*.activo")
    .optional()
    .isBoolean()
    .withMessage("La propiedad 'activo' debe ser boolean"),
  body("horarios.*.rangos").optional().isArray().withMessage("La propiedad 'rangos' debe ser un array"),
]

const validacionActualizarComision = [
  body("porcentaje_comision")
    .isFloat({ min: 0, max: 100 })
    .withMessage("El porcentaje de comisión debe estar entre 0 y 100"),
]

// Rutas
router.get("/", profesionalController.listarProfesionales)
router.post("/", validacionCrearProfesional, profesionalController.crearProfesional)
router.get("/:id", profesionalController.obtenerProfesional)
router.put("/:id", validacionActualizarProfesional, profesionalController.actualizarProfesional)
router.delete("/:id", profesionalController.eliminarProfesional)
router.get("/:id/horarios", profesionalController.obtenerHorariosProfesional)
router.put("/:id/horarios", validacionActualizarHorarios, profesionalController.actualizarHorariosProfesional)
router.get("/:id/horarios-disponibles", profesionalController.obtenerHorariosDisponibles)

router.get("/:id/servicios", profesionalController.obtenerServiciosProfesional)
router.post("/:id/servicios", profesionalController.asignarServicioAProfesional)
router.delete("/:id/servicios/:servicio_id", profesionalController.removerServicioDeProfesional)

router.put("/:id/comision", validacionActualizarComision, profesionalController.actualizarComision)

module.exports = router
