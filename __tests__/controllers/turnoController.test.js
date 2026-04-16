const { Turno, Paciente, Profesional, Servicio, SubServicio, ProfesionalServicio, Prestacion, UsuarioPaciente } = require("../../src/models")

jest.mock("../../src/models", () => ({
  Turno: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Paciente: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Profesional: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn()
  },
  Servicio: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn()
  },
  SubServicio: {
    findOne: jest.fn(),
    findByPk: jest.fn()
  },
  ProfesionalServicio: {
    findOne: jest.fn()
  },
  Prestacion: {
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  },
  UsuarioPaciente: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}))

jest.mock("../../src/services/emailService", () => ({
  enviarConfirmacionTurno: jest.fn().mockResolvedValue(true),
  enviarCancelacionTurno: jest.fn().mockResolvedValue(true),
  enviarReprogramacionTurno: jest.fn().mockResolvedValue(true)
}))

jest.mock("../../src/services/whatsappNotifications", () => ({
  enviarConfirmacionTurnoWhatsApp: jest.fn().mockResolvedValue(true)
}))

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed_dni")
}))

const {
  crearTurno,
  listarTurnos,
  obtenerTurno,
  actualizarTurno,
  eliminarTurno,
  verificarDisponibilidad,
  misTurnos,
  cancelarTurno,
  reprogramarTurno
} = require("../../src/controllers/turnoController")

describe("turnoController", () => {
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

  describe("crearTurno", () => {
    it("should create a valid turno", async () => {
      mockReq.body = {
        paciente_id: "uuid-123",
        profesional_id: 1,
        servicio_id: 1,
        fecha: "2024-06-15",
        hora_inicio: "10:00",
        hora_fin: "11:00",
        estado: "Pendiente"
      }

      const mockTurno = {
        id: 1,
        ...mockReq.body
      }

      ProfesionalServicio.findOne.mockResolvedValue({ profesional_id: 1, servicio_id: 1 })
      Turno.findOne.mockResolvedValue(null)
      Turno.findOne.mockResolvedValueOnce(null)
      Turno.create.mockResolvedValue(mockTurno)
      Turno.findByPk.mockResolvedValue({
        ...mockTurno,
        paciente: { id: "uuid-123", nombre: "Juan", apellido: "Perez", email: "juan@test.com", numero_documento: "12345678" },
        profesional: { id: 1, nombre: "Dr", apellido: "Smith", especialidad: "Odontología" },
        servicio: { id: 1, nombre: "Limpieza", precio_base: 100 },
        subservicio: null
      })

      await crearTurno(mockReq, mockRes)

      expect(Turno.create).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(201)
    })

    it("should fail when profesional-servicio relation does not exist", async () => {
      mockReq.body = {
        paciente_id: "uuid-123",
        profesional_id: 1,
        servicio_id: 1,
        fecha: "2024-06-15",
        hora_inicio: "10:00",
        hora_fin: "11:00"
      }

      ProfesionalServicio.findOne.mockResolvedValue(null)

      await crearTurno(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "El profesional seleccionado no está disponible para este servicio"
      })
    })

    it("should fail when there is horario overlap", async () => {
      mockReq.body = {
        paciente_id: "uuid-123",
        profesional_id: 1,
        servicio_id: 1,
        fecha: "2024-06-15",
        hora_inicio: "10:00",
        hora_fin: "11:00"
      }

      ProfesionalServicio.findOne.mockResolvedValue({ profesional_id: 1, servicio_id: 1 })
      Turno.findOne.mockResolvedValue({
        id: 1,
        profesional_id: 1,
        fecha: "2024-06-15",
        hora_inicio: "09:00",
        hora_fin: "10:30",
        estado: "Confirmado"
      })

      await crearTurno(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "El profesional ya tiene un turno asignado en ese horario"
      })
    })

    it("should fail when patient already has a turno this month", async () => {
      mockReq.body = {
        paciente_id: "uuid-123",
        profesional_id: 1,
        servicio_id: 1,
        fecha: "2024-06-15",
        hora_inicio: "10:00",
        hora_fin: "11:00"
      }

      ProfesionalServicio.findOne.mockResolvedValue({ profesional_id: 1, servicio_id: 1 })
      Turno.findOne.mockResolvedValue(null)
      Turno.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 1, paciente_id: "uuid-123", fecha: "2024-06-10", estado: "Confirmado" })

      await crearTurno(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "El paciente ya posee un turno reservado en este mes."
      })
    })

    it("should allow creating turno with sobre_turno: true", async () => {
      mockReq.body = {
        paciente_id: "uuid-123",
        profesional_id: 1,
        servicio_id: 1,
        fecha: "2024-06-15",
        hora_inicio: "10:00",
        hora_fin: "11:00",
        sobre_turno: true
      }

      const mockTurno = { id: 1, ...mockReq.body }

      Turno.create.mockResolvedValue(mockTurno)
      Turno.findByPk.mockResolvedValue({
        ...mockTurno,
        paciente: { id: "uuid-123", nombre: "Juan", apellido: "Perez", email: "juan@test.com", numero_documento: "12345678" },
        profesional: { id: 1, nombre: "Dr", apellido: "Smith" },
        servicio: { id: 1, nombre: "Limpieza" },
        subservicio: null
      })

      await crearTurno(mockReq, mockRes)

      expect(Turno.findOne).not.toHaveBeenCalled()
      expect(Turno.create).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(201)
    })
  })

  describe("verificarDisponibilidad", () => {
    it("should return available when no overlap", async () => {
      mockReq.query = {
        profesional_id: 1,
        fecha: "2024-06-15",
        hora_inicio: "14:00",
        hora_fin: "15:00"
      }

      Turno.findOne.mockResolvedValue(null)

      await verificarDisponibilidad(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith({
        disponible: true,
        mensaje: "Horario disponible"
      })
    })

    it("should return not available when overlap exists", async () => {
      mockReq.query = {
        profesional_id: 1,
        fecha: "2024-06-15",
        hora_inicio: "14:00",
        hora_fin: "15:00"
      }

      Turno.findOne.mockResolvedValue({
        id: 1,
        profesional_id: 1,
        fecha: "2024-06-15",
        hora_inicio: "13:00",
        hora_fin: "14:30",
        estado: "Confirmado"
      })

      await verificarDisponibilidad(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith({
        disponible: false,
        mensaje: "El profesional ya tiene un turno asignado en ese horario"
      })
    })

    it("should fail when missing required parameters", async () => {
      mockReq.query = { profesional_id: 1 }

      await verificarDisponibilidad(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })
  })

  describe("actualizarTurno", () => {
    it("should update turno successfully", async () => {
      mockReq.params = { id: 1 }
      mockReq.body = { estado: "Confirmado" }

      Turno.update.mockResolvedValue([1])
      Turno.findByPk.mockResolvedValue({
        id: 1,
        estado: "Confirmado",
        paciente: { id: "uuid-123", nombre: "Juan" },
        profesional: { id: 1, nombre: "Dr", porcentaje_comision: 50 },
        servicio: { id: 1, nombre: "Limpieza", precio_base: 100 },
        subservicio: null
      })
      Prestacion.findOne.mockResolvedValue(null)

      await actualizarTurno(mockReq, mockRes)

      expect(Turno.update).toHaveBeenCalledWith({ estado: "Confirmado" }, { where: { id: 1 } })
      expect(mockRes.json).toHaveBeenCalled()
    })

    it("should create Prestacion when estado is Atendido", async () => {
      mockReq.params = { id: 1 }
      mockReq.body = { estado: "Atendido" }

      Turno.update.mockResolvedValue([1])
      Turno.findByPk.mockResolvedValue({
        id: 1,
        profesional_id: 1,
        paciente_id: "uuid-123",
        servicio_id: 1,
        subservicio_id: null,
        precio_final: 100,
        estado: "Atendido"
      })
      Prestacion.findOne.mockResolvedValue(null)
      Profesional.findByPk.mockResolvedValue({ id: 1, porcentaje_comision: 50 })
      Servicio.findByPk.mockResolvedValue({ id: 1, precio_base: 100 })
      Prestacion.create.mockResolvedValue({})

      await actualizarTurno(mockReq, mockRes)

      expect(Prestacion.create).toHaveBeenCalled()
    })

    it("should not create Prestacion if it already exists", async () => {
      mockReq.params = { id: 1 }
      mockReq.body = { estado: "Atendido" }

      Turno.update.mockResolvedValue([1])
      Prestacion.findOne.mockResolvedValue({ id: 1 })

      await actualizarTurno(mockReq, mockRes)

      expect(Prestacion.create).not.toHaveBeenCalled()
    })
  })

  describe("listarTurnos", () => {
    it("should return paginated turnos", async () => {
      mockReq.query = { page: "1", limit: "10" }

      const mockTurnos = {
        count: 1,
        rows: [{ id: 1, fecha: "2024-06-15" }]
      }
      Turno.findAndCountAll.mockResolvedValue(mockTurnos)

      await listarTurnos(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith({
        turnos: mockTurnos.rows,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      })
    })

    it("should filter by date range", async () => {
      mockReq.query = { fecha_desde: "2024-06-01", fecha_hasta: "2024-06-30" }

      Turno.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

      await listarTurnos(mockReq, mockRes)

      expect(Turno.findAndCountAll).toHaveBeenCalled()
    })
  })

  describe("obtenerTurno", () => {
    it("should return turno when found", async () => {
      mockReq.params = { id: 1 }

      const mockTurno = { id: 1, fecha: "2024-06-15" }
      Turno.findByPk.mockResolvedValue(mockTurno)

      await obtenerTurno(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(mockTurno)
    })

    it("should return 404 when not found", async () => {
      mockReq.params = { id: 999 }
      Turno.findByPk.mockResolvedValue(null)

      await obtenerTurno(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })
  })

  describe("eliminarTurno", () => {
    it("should delete turno successfully", async () => {
      mockReq.params = { id: 1 }
      Turno.destroy.mockResolvedValue(1)

      await eliminarTurno(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith({ message: "Turno eliminado correctamente" })
    })

    it("should return 404 when turno not found", async () => {
      mockReq.params = { id: 999 }
      Turno.destroy.mockResolvedValue(0)

      await eliminarTurno(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })
  })
})