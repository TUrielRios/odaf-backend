const { Paciente, ObraSocial, Odontograma, HistorialClinico, Prescripcion, PlanTratamiento, Archivo, Turno, Prestacion, UsuarioPaciente } = require("../../src/models")

jest.mock("../../src/models", () => ({
  Paciente: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  ObraSocial: {
    findOne: jest.fn()
  },
  Odontograma: {
    findOne: jest.fn(),
    destroy: jest.fn()
  },
  HistorialClinico: {
    destroy: jest.fn()
  },
  Prescripcion: {
    destroy: jest.fn()
  },
  PlanTratamiento: {
    destroy: jest.fn()
  },
  Archivo: {
    destroy: jest.fn()
  },
  Turno: {
    destroy: jest.fn()
  },
  Prestacion: {
    destroy: jest.fn()
  },
  UsuarioPaciente: {
    destroy: jest.fn()
  }
}))

const {
  listarPacientes,
  crearPaciente,
  obtenerPaciente,
  actualizarPaciente,
  eliminarPaciente,
  buscarPorDocumento
} = require("../../src/controllers/pacienteController")

describe("pacienteController", () => {
  let mockReq
  let mockRes

  beforeEach(() => {
    jest.clearAllMocks()
    mockReq = {
      body: {},
      params: {},
      query: {}
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
  })

  describe("crearPaciente", () => {
    it("should create a valid paciente", async () => {
      mockReq.body = {
        nombre: "Juan",
        apellido: "Perez",
        numero_documento: "12345678",
        email: "juan@test.com",
        telefono: "123456789",
        fecha_nacimiento: "1990-01-01"
      }

      const mockPaciente = {
        id: "uuid-123",
        ...mockReq.body
      }

      Paciente.create.mockResolvedValue(mockPaciente)
      Paciente.findByPk.mockResolvedValue({
        ...mockPaciente,
        obraSocial: null
      })

      await crearPaciente(mockReq, mockRes)

      expect(Paciente.create).toHaveBeenCalledWith(mockReq.body)
      expect(mockRes.status).toHaveBeenCalledWith(201)
    })

    it("should fail with duplicate documento", async () => {
      mockReq.body = {
        nombre: "Juan",
        numero_documento: "12345678"
      }

      const error = new Error("Unique constraint error")
      error.name = "SequelizeUniqueConstraintError"
      Paciente.create.mockRejectedValue(error)

      await crearPaciente(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({ error: "El número de documento ya existe" })
    })
  })

  describe("listarPacientes", () => {
    it("should return paginated pacientes", async () => {
      mockReq.query = { page: "1", limit: "10" }

      const mockPacientes = {
        count: 1,
        rows: [{ id: "uuid-123", nombre: "Juan", apellido: "Perez" }]
      }
      Paciente.findAndCountAll.mockResolvedValue(mockPacientes)

      await listarPacientes(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith({
        pacientes: mockPacientes.rows,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      })
    })

    it("should filter by search", async () => {
      mockReq.query = { search: "Juan" }

      Paciente.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

      await listarPacientes(mockReq, mockRes)

      expect(Paciente.findAndCountAll).toHaveBeenCalled()
    })
  })

  describe("obtenerPaciente", () => {
    it("should return paciente when found", async () => {
      mockReq.params = { id: "uuid-123" }

      const mockPaciente = { id: "uuid-123", nombre: "Juan" }
      Paciente.findByPk.mockResolvedValue(mockPaciente)

      await obtenerPaciente(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(mockPaciente)
    })

    it("should return 404 when not found", async () => {
      mockReq.params = { id: "uuid-notfound" }
      Paciente.findByPk.mockResolvedValue(null)

      await obtenerPaciente(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })
  })

  describe("actualizarPaciente", () => {
    it("should update paciente successfully", async () => {
      mockReq.params = { id: "uuid-123" }
      mockReq.body = { nombre: "Carlos" }

      Paciente.update.mockResolvedValue([1])
      Paciente.findByPk.mockResolvedValue({
        id: "uuid-123",
        nombre: "Carlos",
        obraSocial: null
      })

      await actualizarPaciente(mockReq, mockRes)

      expect(Paciente.update).toHaveBeenCalledWith({ nombre: "Carlos" }, { where: { id: "uuid-123" } })
      expect(mockRes.json).toHaveBeenCalled()
    })

    it("should return 404 when paciente not found", async () => {
      mockReq.params = { id: "uuid-notfound" }
      mockReq.body = { nombre: "Carlos" }

      Paciente.update.mockResolvedValue([0])

      await actualizarPaciente(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })
  })

  describe("eliminarPaciente", () => {
    it("should delete paciente and related records", async () => {
      mockReq.params = { id: "uuid-123" }

      Turno.destroy.mockResolvedValue(1)
      Prestacion.destroy.mockResolvedValue(1)
      HistorialClinico.destroy.mockResolvedValue(1)
      PlanTratamiento.destroy.mockResolvedValue(1)
      Odontograma.destroy.mockResolvedValue(1)
      Archivo.destroy.mockResolvedValue(1)
      Prescripcion.destroy.mockResolvedValue(1)
      UsuarioPaciente.destroy.mockResolvedValue(1)
      Paciente.destroy.mockResolvedValue(1)

      await eliminarPaciente(mockReq, mockRes)

      expect(Turno.destroy).toHaveBeenCalledWith({ where: { paciente_id: "uuid-123" } })
      expect(Paciente.destroy).toHaveBeenCalledWith({ where: { id: "uuid-123" } })
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Paciente eliminado correctamente" })
    })

    it("should return 404 when paciente not found", async () => {
      mockReq.params = { id: "uuid-notfound" }

      Turno.destroy.mockResolvedValue(0)
      Paciente.destroy.mockResolvedValue(0)

      await eliminarPaciente(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })
  })

  describe("buscarPorDocumento", () => {
    it("should find paciente by documento", async () => {
      mockReq.params = { numero_documento: "12345678" }

      const mockPaciente = { id: "uuid-123", numero_documento: "12345678" }
      Paciente.findOne.mockResolvedValue(mockPaciente)

      await buscarPorDocumento(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(mockPaciente)
    })

    it("should return 404 when not found", async () => {
      mockReq.params = { numero_documento: "00000000" }
      Paciente.findOne.mockResolvedValue(null)

      await buscarPorDocumento(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })
  })
})