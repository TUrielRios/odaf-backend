const express = require("express")
const router = express.Router()
const obraSocialController = require("../controllers/obraSocialController")
const auth = require("../middlewares/auth")

// Listar obras sociales (público para el booking)
router.get("/", obraSocialController.listarObrasSociales)

// CRUD protegido para admin
router.post("/", obraSocialController.crearObraSocial)
router.put("/:id", obraSocialController.actualizarObraSocial)
router.delete("/:id", obraSocialController.eliminarObraSocial)

module.exports = router
