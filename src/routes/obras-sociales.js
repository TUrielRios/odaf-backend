const express = require("express")
const router = express.Router()
const obraSocialController = require("../controllers/obraSocialController")
const auth = require("../middlewares/auth")

// Rutas públicas o protegidas según necesidad. Asumo que listar obras sociales puede ser público o requerir auth básica.
// Si el frontend de reserva es público, esto debería ser público.
router.get("/", obraSocialController.listarObrasSociales)

module.exports = router
