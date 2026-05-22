const express = require("express")
const { body } = require("express-validator")
const { login, register, me, listarUsuarios, actualizarPermisosTabs } = require("../controllers/authController")
const auth = require("../middlewares/auth")

const router = express.Router()

// Validaciones
const loginValidation = [
  body("email").isEmail().withMessage("Email inválido"),
  body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
]

const registerValidation = [
  body("email").isEmail().withMessage("Email inválido"),
  body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
  body("nombre").notEmpty().withMessage("El nombre es requerido"),
]

// Rutas
router.post("/login", loginValidation, login)
router.post("/register", registerValidation, register)
router.get("/me", auth, me)

// Admin: gestión de permisos de tabs para profesionales
router.get("/usuarios", auth, listarUsuarios)
router.put("/usuarios/:id/permisos-tabs", auth, actualizarPermisosTabs)

module.exports = router
