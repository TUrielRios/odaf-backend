const { Procedimiento, ProcedimientoPrecioObraSocial, ObraSocial, sequelize } = require("../models")

const listarProcedimientos = async (req, res) => {
  try {
    const procedimientos = await Procedimiento.findAll({
      include: [
        {
          model: ProcedimientoPrecioObraSocial,
          as: "preciosObraSocial",
          include: [
            {
              model: ObraSocial,
              as: "obraSocial",
              attributes: ["id", "nombre"],
            },
          ],
        },
      ],
      order: [["nombre", "ASC"]],
    })
    res.json(procedimientos)
  } catch (error) {
    console.error("Error al listar procedimientos:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const obtenerProcedimiento = async (req, res) => {
  try {
    const { id } = req.params
    const procedimiento = await Procedimiento.findByPk(id, {
      include: [
        {
          model: ProcedimientoPrecioObraSocial,
          as: "preciosObraSocial",
          include: [
            {
              model: ObraSocial,
              as: "obraSocial",
              attributes: ["id", "nombre"],
            },
          ],
        },
      ],
    })
    if (!procedimiento) {
      return res.status(404).json({ error: "Procedimiento no encontrado" })
    }
    res.json(procedimiento)
  } catch (error) {
    console.error("Error al obtener procedimiento:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const crearProcedimiento = async (req, res) => {
  const transaction = await sequelize.transaction()
  try {
    const { nombre, precio_ars, precio_usd, preciosObraSocial } = req.body

    if (!nombre || !nombre.trim()) {
      await transaction.rollback()
      return res.status(400).json({ error: "El nombre es requerido" })
    }

    const procedimiento = await Procedimiento.create(
      {
        nombre: nombre.trim(),
        precio_ars: precio_ars || 0,
        precio_usd: precio_usd || 0,
      },
      { transaction }
    )

    if (preciosObraSocial && Array.isArray(preciosObraSocial)) {
      const itemsToCreate = preciosObraSocial.map((item) => ({
        procedimiento_id: procedimiento.id,
        obra_social_id: item.obra_social_id,
        codigo: item.codigo || null,
        precio_paciente: item.precio_paciente !== undefined && item.precio_paciente !== "" ? item.precio_paciente : null,
        usar_precio_particular: item.usar_precio_particular !== undefined ? item.usar_precio_particular : true,
        cobertura: item.cobertura !== undefined && item.cobertura !== "" ? item.cobertura : null,
        precio_sugerido: item.precio_sugerido !== undefined && item.precio_sugerido !== "" ? item.precio_sugerido : null,
      }))

      await ProcedimientoPrecioObraSocial.bulkCreate(itemsToCreate, { transaction })
    }

    await transaction.commit()

    const result = await Procedimiento.findByPk(procedimiento.id, {
      include: [
        {
          model: ProcedimientoPrecioObraSocial,
          as: "preciosObraSocial",
          include: [
            {
              model: ObraSocial,
              as: "obraSocial",
              attributes: ["id", "nombre"],
            },
          ],
        },
      ],
    })

    res.status(201).json(result)
  } catch (error) {
    await transaction.rollback()
    console.error("Error al crear procedimiento:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const actualizarProcedimiento = async (req, res) => {
  const transaction = await sequelize.transaction()
  try {
    const { id } = req.params
    const { nombre, precio_ars, precio_usd, preciosObraSocial } = req.body

    const procedimiento = await Procedimiento.findByPk(id, { transaction })
    if (!procedimiento) {
      await transaction.rollback()
      return res.status(404).json({ error: "Procedimiento no encontrado" })
    }

    if (!nombre || !nombre.trim()) {
      await transaction.rollback()
      return res.status(400).json({ error: "El nombre es requerido" })
    }

    await procedimiento.update(
      {
        nombre: nombre.trim(),
        precio_ars: precio_ars !== undefined ? precio_ars : procedimiento.precio_ars,
        precio_usd: precio_usd !== undefined ? precio_usd : procedimiento.precio_usd,
      },
      { transaction }
    )

    if (preciosObraSocial && Array.isArray(preciosObraSocial)) {
      await ProcedimientoPrecioObraSocial.destroy({
        where: { procedimiento_id: id },
        transaction,
      })

      const itemsToCreate = preciosObraSocial.map((item) => ({
        procedimiento_id: id,
        obra_social_id: item.obra_social_id,
        codigo: item.codigo || null,
        precio_paciente: item.precio_paciente !== undefined && item.precio_paciente !== "" ? item.precio_paciente : null,
        usar_precio_particular: item.usar_precio_particular !== undefined ? item.usar_precio_particular : true,
        cobertura: item.cobertura !== undefined && item.cobertura !== "" ? item.cobertura : null,
        precio_sugerido: item.precio_sugerido !== undefined && item.precio_sugerido !== "" ? item.precio_sugerido : null,
      }))

      await ProcedimientoPrecioObraSocial.bulkCreate(itemsToCreate, { transaction })
    }

    await transaction.commit()

    const result = await Procedimiento.findByPk(id, {
      include: [
        {
          model: ProcedimientoPrecioObraSocial,
          as: "preciosObraSocial",
          include: [
            {
              model: ObraSocial,
              as: "obraSocial",
              attributes: ["id", "nombre"],
            },
          ],
        },
      ],
    })

    res.json(result)
  } catch (error) {
    await transaction.rollback()
    console.error("Error al actualizar procedimiento:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

const eliminarProcedimiento = async (req, res) => {
  try {
    const { id } = req.params
    const procedimiento = await Procedimiento.findByPk(id)
    if (!procedimiento) {
      return res.status(404).json({ error: "Procedimiento no encontrado" })
    }

    await procedimiento.destroy()
    res.json({ message: "Procedimiento eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar procedimiento:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  listarProcedimientos,
  obtenerProcedimiento,
  crearProcedimiento,
  actualizarProcedimiento,
  eliminarProcedimiento,
}
