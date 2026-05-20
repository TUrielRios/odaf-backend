const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { validationResult } = require("express-validator")

const ADMIN_EMAIL = "odlanus@gmail.com"
const ADMIN_PASSWORD = "Benty233"
const PROFESIONAL_PASSWORD = "Lanus2025"

const login = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    // Check admin login
    if (email === ADMIN_EMAIL) {
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Credenciales inválidas" })
      }

      const token = jwt.sign(
        {
          userId: 1,
          email: ADMIN_EMAIL,
          role: "admin",
        },
        process.env.JWT_SECRET || "dental_clinic_secret",
        { expiresIn: "24h" },
      )

      return res.json({
        token,
        user: {
          id: 1,
          email: ADMIN_EMAIL,
          nombre: "Administrador",
          role: "admin",
        },
      })
    }

    // Check professional login
    const { Profesional } = require("../models")
    const profesional = await Profesional.findOne({ where: { email } })

    if (!profesional) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    if (password !== PROFESIONAL_PASSWORD) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    const token = jwt.sign(
      {
        userId: profesional.id,
        email: profesional.email,
        role: "profesional",
        profesionalId: profesional.id,
      },
      process.env.JWT_SECRET || "dental_clinic_secret",
      { expiresIn: "24h" },
    )

    return res.json({
      token,
      user: {
        id: profesional.id,
        email: profesional.email,
        nombre: `${profesional.nombre} ${profesional.apellido}`,
        role: "profesional",
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
    const { role, email, userId } = req.user

    if (role === "admin") {
      return res.json({
        id: 1,
        email: ADMIN_EMAIL,
        nombre: "Administrador",
        role: "admin",
      })
    }

    const { Profesional } = require("../models")
    const profesional = await Profesional.findByPk(userId)
    if (!profesional) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    return res.json({
      id: profesional.id,
      email: profesional.email,
      nombre: `${profesional.nombre} ${profesional.apellido}`,
      role: "profesional",
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
