const bcrypt = require("bcryptjs")
const { UsuarioAdmin, Profesional } = require("../models")

async function seedUsuarios() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD
    const profesionalPassword = process.env.PROFESIONAL_PASSWORD

    if (!adminEmail || !adminPassword || !profesionalPassword) {
      console.log("⚠️  Variables ADMIN_EMAIL, ADMIN_PASSWORD, PROFESIONAL_PASSWORD no configuradas. Seed de usuarios omitido.")
      return
    }

    // Crear admin si no existe
    const adminExists = await UsuarioAdmin.findOne({ where: { email: adminEmail } })
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10)
      await UsuarioAdmin.create({
        email: adminEmail,
        password: hashedPassword,
        nombre: "Administrador",
        role: "admin",
      })
      console.log("✅ Usuario admin creado")
    }

    // Crear usuarios para cada profesional activo que no tenga usuario
    const profesionales = await Profesional.findAll({ where: { estado: "Activo" } })
    const defaultPassword = await bcrypt.hash(profesionalPassword, 10)

    for (const prof of profesionales) {
      if (!prof.email) continue

      const exists = await UsuarioAdmin.findOne({ where: { email: prof.email } })
      if (!exists) {
        await UsuarioAdmin.create({
          email: prof.email,
          password: defaultPassword,
          nombre: `${prof.nombre} ${prof.apellido}`,
          role: "profesional",
          profesional_id: prof.id,
        })
        console.log(`✅ Usuario profesional creado: ${prof.email}`)
      }
    }
  } catch (error) {
    console.error("Error en seed de usuarios:", error.message)
  }
}

module.exports = { seedUsuarios }
