const express = require("express")
const { body } = require("express-validator")
const {
  listarPacientes,
  crearPaciente,
  obtenerPaciente,
  actualizarPaciente,
  eliminarPaciente,
  buscarPorDocumento,
  subirFotoPaciente,
} = require("../controllers/pacienteController")
const auth = require("../middlewares/auth")
const multer = require("multer")

const router = express.Router()

// Configuración de multer con memoryStorage para Firebase
const fotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'))
    }
  }
})


// Validaciones para paciente
const pacienteValidation = [
  body("apellido").notEmpty().withMessage("El apellido es requerido"),
  body("nombre").notEmpty().withMessage("El nombre es requerido"),
  body("tipo_documento").isIn(["DNI", "Pasaporte", "Cédula"]).withMessage("Tipo de documento inválido"),
  body("numero_documento").notEmpty().withMessage("El número de documento es requerido"),
  body("fecha_nacimiento").optional({ nullable: true, checkFalsy: true }).isDate().withMessage("Fecha de nacimiento inválida"),
  body("sexo").optional({ nullable: true, checkFalsy: true }).isIn(["Masculino", "Femenino", "Otro"]).withMessage("Sexo inválido"),
]

// Aplicar autenticación a todas las rutas
// router.use(auth)

// Rutas
router.get("/", listarPacientes)
router.post("/", pacienteValidation, crearPaciente)
// IMPORTANTE: Esta ruta debe estar ANTES de /:id para que no capture "documento" como un ID
router.get("/documento/:numero_documento", buscarPorDocumento)
router.get("/:id", obtenerPaciente)
router.put("/:id", pacienteValidation, actualizarPaciente)
router.put("/:id/foto", fotoUpload.single("foto"), subirFotoPaciente)
router.delete("/:id", eliminarPaciente)

module.exports = router
