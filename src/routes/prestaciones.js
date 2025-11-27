const express = require("express")
const router = express.Router()
const prestacionController = require("../controllers/prestacionController")
const { body } = require("express-validator")

/**
 * Validaciones
 */
const validacionCrearPrestacion = [
  body("profesional_id").isInt().withMessage("El ID del profesional es requerido"),
  body("fecha").isDate().withMessage("La fecha debe ser válida"),
  body("monto_total").isDecimal({ decimal_digits: "0,2" }).withMessage("El monto total debe ser un número válido"),
  body("porcentaje_profesional")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("El porcentaje debe ser un número válido")
    .custom((value) => {
      if (value < 0 || value > 100) {
        throw new Error("El porcentaje debe estar entre 0 y 100")
      }
      return true
    }),
]

const validacionActualizarPrestacion = [
  body("monto_total")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("El monto total debe ser un número válido"),
  body("porcentaje_profesional")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("El porcentaje debe ser un número válido")
    .custom((value) => {
      if (value < 0 || value > 100) {
        throw new Error("El porcentaje debe estar entre 0 y 100")
      }
      return true
    }),
  body("estado").optional().isIn(["Pendiente", "Liquidado", "Pagado"]).withMessage("Estado inválido"),
]

const validacionLiquidar = [
  body("prestacion_ids").isArray({ min: 1 }).withMessage("Se requiere un array de prestacion_ids"),
  body("fecha_liquidacion").optional().isDate().withMessage("La fecha de liquidación debe ser válida"),
]

const validacionMarcarPagado = [
  body("prestacion_ids").isArray({ min: 1 }).withMessage("Se requiere un array de prestacion_ids"),
  body("fecha_pago").optional().isDate().withMessage("La fecha de pago debe ser válida"),
]

/**
 * Rutas
 */

// CRUD básico de prestaciones
router.get("/", prestacionController.listarPrestaciones)
router.post("/", validacionCrearPrestacion, prestacionController.crearPrestacion)
router.get("/:id", prestacionController.obtenerPrestacion)
router.put("/:id", validacionActualizarPrestacion, prestacionController.actualizarPrestacion)
router.delete("/:id", prestacionController.eliminarPrestacion)

// Rutas específicas para liquidación
router.get("/profesional/:profesional_id/liquidacion", prestacionController.calcularLiquidacion)
router.post("/profesional/:profesional_id/liquidar", validacionLiquidar, prestacionController.liquidarPrestaciones)
router.post("/profesional/:profesional_id/pagar", validacionMarcarPagado, prestacionController.marcarComoPagado)
router.get("/profesional/:profesional_id/resumen", prestacionController.obtenerResumenProfesional)

module.exports = router
