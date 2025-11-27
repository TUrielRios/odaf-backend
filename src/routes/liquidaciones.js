const express = require("express")
const router = express.Router()
const liquidacionController = require("../controllers/liquidacionController")
const { body, param, query } = require("express-validator")

// Validaciones
const validarGenerarLiquidacion = [
  body("profesional_id").isInt().withMessage("El ID del profesional debe ser un número entero"),
  body("periodo_inicio").isDate().withMessage("La fecha de inicio debe ser válida"),
  body("periodo_fin").isDate().withMessage("La fecha de fin debe ser válida"),
  body("observaciones").optional().isString(),
]

const validarRegistrarPago = [
  param("id").isInt().withMessage("El ID de la liquidación debe ser un número entero"),
  body("fecha_pago").isDate().withMessage("La fecha de pago debe ser válida"),
  body("metodo_pago").isString().notEmpty().withMessage("El método de pago es requerido"),
  body("observaciones").optional().isString(),
]

const validarAnularLiquidacion = [
  param("id").isInt().withMessage("El ID de la liquidación debe ser un número entero"),
  body("motivo").isString().notEmpty().withMessage("El motivo de anulación es requerido"),
]

// Rutas
router.get("/", liquidacionController.obtenerLiquidaciones)
router.get("/:id", liquidacionController.obtenerLiquidacionPorId)
router.post("/", validarGenerarLiquidacion, liquidacionController.generarLiquidacion)
router.put("/:id/pagar", validarRegistrarPago, liquidacionController.registrarPago)
router.put("/:id/anular", validarAnularLiquidacion, liquidacionController.anularLiquidacion)
router.get("/profesional/:profesional_id/resumen", liquidacionController.obtenerResumenPorProfesional)

module.exports = router
