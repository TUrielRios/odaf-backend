const express = require("express")
const { body } = require("express-validator")
const { enviarRecordatorioManual, enviarRecordatoriosMasivos } = require("../controllers/recordatorioController")

const router = express.Router()

router.post("/enviar", [body("turno_id").isInt().withMessage("El ID del turno es requerido")], enviarRecordatorioManual)
router.post("/enviar-masivo", [body("fecha").isDate().withMessage("La fecha es requerida")], enviarRecordatoriosMasivos)

module.exports = router
