const express = require("express")
const { body } = require("express-validator")
const servicioController = require("../controllers/servicioController")
const authMiddleware = require("../middlewares/auth")

const router = express.Router()

// Aplicar middleware de autenticación a todas las rutas
//router.use(authMiddleware)

const validacionCrearServicio = [
  body("nombre").notEmpty().withMessage("El nombre del servicio es requerido"),
  body("descripcion").optional().isString().withMessage("La descripción debe ser texto"),
  body("precio_base").isDecimal({ decimal_digits: "0,2" }).withMessage("El precio base debe ser un número decimal válido"),
  body("duracion_estimada").isInt({ min: 15, max: 480 }).withMessage("La duración estimada debe estar entre 15 y 480 minutos"),
  body("categoria").notEmpty().withMessage("La categoría es requerida"),
  body("estado").optional().isIn(["Activo", "Inactivo"]).withMessage("El estado debe ser 'Activo' o 'Inactivo'"),
  body("requiere_autorizacion").optional().isBoolean().withMessage("Requiere autorización debe ser verdadero o falso"),
]

const validacionActualizarServicio = [
  body("nombre").optional().notEmpty().withMessage("El nombre no puede estar vacío"),
  body("descripcion").optional().isString().withMessage("La descripción debe ser texto"),
  body("precio_base")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("El precio base debe ser un número decimal válido"),
  body("duracion_estimada")
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage("La duración estimada debe estar entre 15 y 480 minutos"),
  body("categoria").optional().notEmpty().withMessage("La categoría no puede estar vacía"),
  body("estado").optional().isIn(["Activo", "Inactivo"]).withMessage("El estado debe ser 'Activo' o 'Inactivo'"),
  body("requiere_autorizacion").optional().isBoolean().withMessage("Requiere autorización debe ser verdadero o falso"),
]

const validacionCrearSubServicio = [
  body("nombre").notEmpty().withMessage("El nombre del subservicio es requerido"),
  body("descripcion").optional().isString().withMessage("La descripción debe ser texto"),
  body("precio").isDecimal({ decimal_digits: "0,2" }).withMessage("El precio debe ser un número decimal válido"),
  body("duracion_minutos").isInt({ min: 15, max: 480 }).withMessage("La duración debe estar entre 15 y 480 minutos"),
  body("servicio_id").isInt().withMessage("El ID del servicio es requerido"),
]

const validacionActualizarSubServicio = [
  body("nombre").optional().notEmpty().withMessage("El nombre no puede estar vacío"),
  body("descripcion").optional().isString().withMessage("La descripción debe ser texto"),
  body("precio")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("El precio debe ser un número decimal válido"),
  body("duracion_minutos")
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage("La duración debe estar entre 15 y 480 minutos"),
  body("activo").optional().isBoolean().withMessage("El estado activo debe ser verdadero o falso"),
]

// Rutas
router.get("/", servicioController.listarServicios)
router.post("/", validacionCrearServicio, servicioController.crearServicio)
router.get("/:id", servicioController.obtenerServicio)
router.put("/:id", validacionActualizarServicio, servicioController.actualizarServicio)
router.delete("/:id", servicioController.eliminarServicio)
router.get("/:id/subservicios", servicioController.obtenerSubservicios)

router.get("/:id/profesionales", servicioController.obtenerProfesionalesServicio)

// Rutas para gestión de subservicios
router.post("/subservicios", validacionCrearSubServicio, servicioController.crearSubServicio)
router.put("/subservicios/:id", validacionActualizarSubServicio, servicioController.actualizarSubServicio)
router.delete("/subservicios/:id", servicioController.eliminarSubServicio)

module.exports = router
