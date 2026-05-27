const express = require("express")
const { body } = require("express-validator")
const presupuestoController = require("../controllers/presupuestoController")
const authMiddleware = require("../middlewares/auth")

const router = express.Router()

// Aplicar middleware de autenticación a todas las rutas (si corresponde, en este sistema está comentado)
// router.use(authMiddleware)

// Validaciones
const validacionCrearPresupuesto = [
  body("paciente_id").notEmpty().withMessage("El ID del paciente es requerido"),
  body("fecha").isDate().withMessage("La fecha debe ser válida"),
  body("items").isArray().withMessage("Los ítems deben ser un array"),
  body("monto_total").isNumeric().withMessage("El monto total debe ser numérico"),
]

const validacionActualizarPresupuesto = [
  body("fecha").optional().isDate().withMessage("La fecha debe ser válida"),
  body("items").optional().isArray().withMessage("Los ítems deben ser un array"),
  body("monto_total").optional().isNumeric().withMessage("El monto total debe ser numérico"),
]

// Rutas
router.get("/", presupuestoController.listarPresupuestos)
router.post("/", validacionCrearPresupuesto, presupuestoController.crearPresupuesto)
router.get("/:id", presupuestoController.obtenerPresupuesto)
router.put("/:id", validacionActualizarPresupuesto, presupuestoController.actualizarPresupuesto)
router.delete("/:id", presupuestoController.eliminarPresupuesto)

module.exports = router
