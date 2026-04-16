jest.mock("bcryptjs", () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue("hashed_password")
}))

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mock_token")
}))

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

      await login(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith({
        token: "mock_token",
        user: {
          id: 1,
          email: "admin@dental.com",
          nombre: "Administrador",
          role: "admin"
        }
      })
    })

    it("should fail with invalid email", async () => {
      mockReq.body = {
        email: "wrong@test.com",
        password: "password"
      }

      await login(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Credenciales inválidas" })
    })

    it("should fail with invalid password", async () => {
      mockReq.body = {
        email: "admin@dental.com",
        password: "wrongpassword"
      }

      const bcrypt = require("bcryptjs")
      bcrypt.compare.mockResolvedValueOnce(false)

      await login(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(401)
    })
  })

  describe("register", () => {
    it("should register new user successfully", async () => {
      mockReq.body = {
        email: "newadmin@test.com",
        password: "newpassword",
        nombre: "New Admin"
      }

      await register(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalled()
    })

    it("should fail if user already exists", async () => {
      mockReq.body = {
        email: "admin@dental.com",
        password: "password",
        nombre: "Admin"
      }

      await register(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({ error: "El usuario ya existe" })
    })
  })

  describe("me", () => {
    it("should return current user info", async () => {
      mockReq.user = { userId: 1 }

      await me(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith({
        id: 1,
        email: "admin@dental.com",
        nombre: "Administrador",
        role: "admin"
      })
    })

    it("should return 404 if user not found", async () => {
      mockReq.user = { userId: 999 }

      await me(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })
  })
})