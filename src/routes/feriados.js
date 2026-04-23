const express = require("express")
const { body } = require("express-validator")
const { listarFeriados, crearFeriado, eliminarFeriado } = require("../controllers/feriadoController")

const router = express.Router()

const validacionCrearFeriado = [
  body("fecha").isDate().withMessage("La fecha es requerida y debe ser válida"),
  body("descripcion").optional().isString().withMessage("La descripción debe ser texto"),
]

router.get("/", listarFeriados)
router.post("/", validacionCrearFeriado, crearFeriado)
router.delete("/:id", eliminarFeriado)

module.exports = router
