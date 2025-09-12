const express = require("express")
const { body } = require("express-validator")
const configuracionSistemaController = require("../controllers/configuracionSistemaController")
const authMiddleware = require("../middlewares/auth")

const router = express.Router()

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware)

// Validaciones
const validacionActualizarConfiguracion = [
  body("clave").notEmpty().withMessage("La clave de configuración es requerida"),
  body("valor").notEmpty().withMessage("El valor de configuración es requerido"),
  body("tipo").optional().isIn(["string", "number", "boolean", "json"]).withMessage("Tipo de configuración inválido"),
]

// Rutas
router.get("/", configuracionSistemaController.obtenerConfiguraciones)
router.get("/:clave", configuracionSistemaController.obtenerConfiguracion)
router.put("/:clave", validacionActualizarConfiguracion, configuracionSistemaController.actualizarConfiguracion)
router.post("/", validacionActualizarConfiguracion, configuracionSistemaController.crearConfiguracion)
router.delete("/:clave", configuracionSistemaController.eliminarConfiguracion)

module.exports = router
