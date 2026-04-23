const jwt = require("jsonwebtoken")

const auth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ error: "Token de acceso requerido" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dental_clinic_secret")
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.warn("Token de acceso expirado")
    } else {
      console.error("Error de autenticación:", error.message)
    }
    res.status(401).json({ error: "Token inválido o expirado" })
  }
}

module.exports = auth
