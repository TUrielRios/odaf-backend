const express = require("express")
const router = express.Router()
const { body } = require("express-validator")
const cuentaCorrienteController = require("../controllers/cuentaCorrienteController")

const validacionMovimiento = [
    body("fecha").isDate().withMessage("Fecha inválida"),
    body("tipo").isIn(["Ingreso", "Deuda", "Egreso"]).withMessage("Tipo inválido"),
    body("monto").isFloat({ min: 0 }).withMessage("El monto debe ser positivo"),
    body("forma_pago").optional().isString(),
]

router.get("/deudores", cuentaCorrienteController.obtenerDeudores)
router.get("/caja", cuentaCorrienteController.obtenerFlujoCaja)
router.post("/caja", validacionMovimiento, cuentaCorrienteController.registrarMovimiento)

router.get("/:pacienteId", cuentaCorrienteController.obtenerMovimientos)
router.post("/:pacienteId", validacionMovimiento, cuentaCorrienteController.registrarMovimiento)
router.delete("/:id", cuentaCorrienteController.eliminarMovimiento)

module.exports = router
