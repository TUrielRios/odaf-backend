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
          permisos_tabs: user.permisos_tabs || null,
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
        permisos_tabs: user.permisos_tabs || null,
      },
    })
  } catch (error) {
    console.error("Error en me:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const listarUsuarios = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Acceso denegado" })
    }

    const { UsuarioAdmin } = require("../models")
    const usuarios = await UsuarioAdmin.findAll({
      attributes: ["id", "email", "nombre", "role", "profesional_id", "activo", "permisos_tabs"],
      order: [["nombre", "ASC"]],
    })

    res.json({ data: usuarios })
  } catch (error) {
    console.error("Error listando usuarios:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarPermisosTabs = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Acceso denegado" })
    }

    const { id } = req.params
    const { permisos_tabs } = req.body

    const { UsuarioAdmin } = require("../models")
    const usuario = await UsuarioAdmin.findByPk(id)

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    await usuario.update({ permisos_tabs })

    res.json({
      data: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        role: usuario.role,
        permisos_tabs: usuario.permisos_tabs,
      },
    })
  } catch (error) {
    console.error("Error actualizando permisos:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  login,
  register,
  me,
  listarUsuarios,
  actualizarPermisosTabs,
}
