const express = require("express")
const { body } = require("express-validator")
const archivoController = require("../controllers/archivoController")
const authMiddleware = require("../middlewares/auth")
const upload = require("../config/upload")

const router = express.Router()

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware)

// Validaciones
const validacionSubirArchivo = [
  body("paciente_id").notEmpty().withMessage("El ID del paciente es requerido"),
  body("categoria")
    .optional()
    .isIn(["Radiografia", "Foto", "Documento", "Laboratorio", "Otro"])
    .withMessage("Categoría inválida"),
]

// Rutas
router.get("/", archivoController.listarArchivos)
router.post("/", upload.single("archivo"), validacionSubirArchivo, archivoController.subirArchivo)
router.get("/:id", archivoController.obtenerArchivo)
router.get("/:id/descargar", archivoController.descargarArchivo)
router.delete("/:id", archivoController.eliminarArchivo)

module.exports = router
