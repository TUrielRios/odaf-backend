const express = require("express")
const router = express.Router()
const copagoController = require("../controllers/copagoController")

// Ruta pública para obtener copago durante la reserva
router.get("/", copagoController.obtenerCopago)

module.exports = router
