const express = require("express")
const router = express.Router()
const ausenciaController = require("../controllers/ausenciaController")
const { authMiddleware } = require("../middlewares/auth")

// Descomentar cuando el auth esté funcionando
// router.use(authMiddleware)

router.get("/", ausenciaController.listarAusencias)
router.post("/", ausenciaController.crearAusencia)
router.delete("/:id", ausenciaController.eliminarAusencia)

module.exports = router
