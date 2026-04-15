const express = require("express")
const { body } = require("express-validator")
const { validationResult } = require("express-validator")
const usuarioPacienteController = require("../controllers/usuarioPacienteController")
const authMiddleware = require("../middlewares/auth")

const router = express.Router()

const validacionLogin = [
  body("email").isEmail().withMessage("El email debe ser valido"),
  body("dni").notEmpty().withMessage("El DNI es requerido"),
]

const validacionRegistro = [
  body("email").isEmail().withMessage("El email debe ser valido"),
  body("dni").notEmpty().withMessage("El DNI es requerido"),
  body("paciente_id").isUUID().withMessage("El ID del paciente es requerido"),
]

router.get("/buscar/:email", async (req, res) => {
  try {
    const { email } = req.params
    const usuario = await usuarioPacienteController.buscarPorEmail(email)
    res.json({
      existe: !!usuario,
      usuario: usuario ? { email: usuario.email, paciente_id: usuario.paciente_id } : null,
    })
  } catch (error) {
    console.error("Error al buscar usuario:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

router.post("/registro", validacionRegistro, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, dni, paciente_id } = req.body

    const existente = await usuarioPacienteController.buscarPorEmail(email)
    if (existente) {
      return res.status(400).json({ error: "El usuario ya existe" })
    }

    const usuario = await usuarioPacienteController.registrar(email, dni, paciente_id)

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      usuario: {
        id: usuario.id,
        email: usuario.email,
        paciente_id: usuario.paciente_id,
      },
    })
  } catch (error) {
    console.error("Error en registro:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

router.post("/login", validacionLogin, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, dni } = req.body

    const result = await usuarioPacienteController.login(email, dni)
    res.json(result)
  } catch (error) {
    console.error("Error en login:", error)
    if (error.message === "Usuario no encontrado" || error.message === "Credenciales invalidas") {
      return res.status(401).json({ error: error.message })
    }
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

router.get("/perfil", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "paciente") {
      return res.status(403).json({ error: "Acceso denegado" })
    }

    const perfil = await usuarioPacienteController.obtenerPerfil(req.user.pacienteId)
    res.json(perfil)
  } catch (error) {
    console.error("Error al obtener perfil:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

module.exports = router
