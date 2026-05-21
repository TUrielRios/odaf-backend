const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { validationResult } = require("express-validator")

const login = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body
    const { UsuarioAdmin } = require("../models")

    const user = await UsuarioAdmin.findOne({ where: { email, activo: true } })
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        profesionalId: user.profesional_id || null,
      },
      process.env.JWT_SECRET || "dental_clinic_secret",
      { expiresIn: "24h" },
    )

    res.json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          role: user.role,
        },
      },
    })
  } catch (error) {
    console.error("Error en login:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const register = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    return res.status(403).json({ error: "Registro deshabilitado" })
  } catch (error) {
    console.error("Error en registro:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const me = async (req, res) => {
  try {
    const { UsuarioAdmin } = require("../models")
    const user = await UsuarioAdmin.findByPk(req.user.userId)

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    res.json({
      data: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Error en me:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  login,
  register,
  me,
}
