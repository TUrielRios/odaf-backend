const express = require("express")
const router = express.Router()
const procedimientoController = require("../controllers/procedimientoController")

// CRUD endpoints for Procedimiento
router.get("/", procedimientoController.listarProcedimientos)
router.get("/:id", procedimientoController.obtenerProcedimiento)
router.post("/", procedimientoController.crearProcedimiento)
router.put("/:id", procedimientoController.actualizarProcedimiento)
router.delete("/:id", procedimientoController.eliminarProcedimiento)

module.exports = router
