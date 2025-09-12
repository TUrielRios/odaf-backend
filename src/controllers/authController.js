const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { validationResult } = require("express-validator")

// Simulamos un modelo de usuario admin (en producción esto debería estar en la BD)
const adminUsers = [
  {
    id: 1,
    email: "admin@dental.com",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    role: "admin",
    nombre: "Administrador",
  },
]

const login = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    // Buscar usuario
    const user = adminUsers.find((u) => u.email === email)
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    // Generar token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "dental_clinic_secret",
      { expiresIn: "24h" },
    )

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role,
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

    const { email, password, nombre } = req.body

    // Verificar si el usuario ya existe
    const existingUser = adminUsers.find((u) => u.email === email)
    if (existingUser) {
      return res.status(400).json({ error: "El usuario ya existe" })
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear nuevo usuario
    const newUser = {
      id: adminUsers.length + 1,
      email,
      password: hashedPassword,
      nombre,
      role: "admin",
    }

    adminUsers.push(newUser)

    // Generar token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      process.env.JWT_SECRET || "dental_clinic_secret",
      { expiresIn: "24h" },
    )

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        nombre: newUser.nombre,
        role: newUser.role,
      },
    })
  } catch (error) {
    console.error("Error en registro:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const me = async (req, res) => {
  try {
    const user = adminUsers.find((u) => u.id === req.user.userId)
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    res.json({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
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
