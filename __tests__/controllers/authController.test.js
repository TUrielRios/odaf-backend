jest.mock("bcryptjs", () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue("hashed_password")
}))

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mock_token")
}))

jest.mock("../../src/models", () => ({
  UsuarioAdmin: {
    findOne: jest.fn(),
    findByPk: jest.fn()
  }
}))

const { UsuarioAdmin } = require("../../src/models")
const { login, register, me } = require("../../src/controllers/authController")

describe("authController", () => {
  let mockReq
  let mockRes

  beforeEach(() => {
    jest.clearAllMocks()
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: {}
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
  })

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      mockReq.body = {
        email: "admin@dental.com",
        password: "password"
      }

      UsuarioAdmin.findOne.mockResolvedValue({
        id: 1,
        email: "admin@dental.com",
        password: "hashed_password",
        nombre: "Administrador",
        role: "admin",
        activo: true
      })

      await login(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith({
        data: {
          token: "mock_token",
          user: {
            id: 1,
            email: "admin@dental.com",
            nombre: "Administrador",
            role: "admin",
            permisos_tabs: null
          }
        }
      })
    })

    it("should fail with invalid email", async () => {
      mockReq.body = {
        email: "wrong@test.com",
        password: "password"
      }

      UsuarioAdmin.findOne.mockResolvedValue(null)

      await login(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Credenciales inválidas" })
    })

    it("should fail with invalid password", async () => {
      mockReq.body = {
        email: "admin@dental.com",
        password: "wrongpassword"
      }

      UsuarioAdmin.findOne.mockResolvedValue({
        id: 1,
        email: "admin@dental.com",
        password: "hashed_password",
        nombre: "Administrador",
        role: "admin",
        activo: true
      })

      const bcrypt = require("bcryptjs")
      bcrypt.compare.mockResolvedValueOnce(false)

      await login(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(401)
    })
  })

  describe("register", () => {
    it("should return 403 since registration is disabled", async () => {
      mockReq.body = {
        email: "newadmin@test.com",
        password: "newpassword",
        nombre: "New Admin"
      }

      await register(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Registro deshabilitado" })
    })
  })

  describe("me", () => {
    it("should return current user info", async () => {
      mockReq.user = { userId: 1 }

      UsuarioAdmin.findByPk.mockResolvedValue({
        id: 1,
        email: "admin@dental.com",
        nombre: "Administrador",
        role: "admin",
        permisos_tabs: null
      })

      await me(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith({
        data: {
          id: 1,
          email: "admin@dental.com",
          nombre: "Administrador",
          role: "admin",
          permisos_tabs: null
        }
      })
    })

    it("should return 404 if user not found", async () => {
      mockReq.user = { userId: 999 }

      UsuarioAdmin.findByPk.mockResolvedValue(null)

      await me(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })
  })
})