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

// Configuración de multer para fotos de pacientes
const fotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require("fs")
    const path = require("path")
    const uploadPath = path.join(__dirname, "../uploads/fotos-pacientes")
    fs.mkdirSync(uploadPath, { recursive: true })
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const path = require("path")
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, "foto-" + uniqueSuffix + path.extname(file.originalname))
  },
})
const fotoUpload = multer({
  storage: fotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const path = require("path")
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    if (extname) {
      return cb(null, true)
    }
    cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, gif, webp)"))
  },
})

// Validaciones para paciente
const pacienteValidation = [
  body("apellido").notEmpty().withMessage("El apellido es requerido"),
  body("nombre").notEmpty().withMessage("El nombre es requerido"),
  body("tipo_documento").isIn(["DNI", "Pasaporte", "Cédula"]).withMessage("Tipo de documento inválido"),
  body("numero_documento").notEmpty().withMessage("El número de documento es requerido"),
  body("fecha_nacimiento").isDate().withMessage("Fecha de nacimiento inválida"),
  body("sexo").isIn(["Masculino", "Femenino", "Otro"]).withMessage("Sexo inválido"),
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
