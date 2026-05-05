const express = require("express")
const { body } = require("express-validator")
const {
  enviarRecordatorioManual,
  enviarRecordatoriosMasivos,
  previewRecordatorio,
  obtenerTemplate,
  guardarTemplate,
} = require("../controllers/recordatorioController")

const router = express.Router()

router.post("/enviar", [body("turno_id").isInt().withMessage("El ID del turno es requerido")], enviarRecordatorioManual)
router.post("/enviar-masivo", [body("fecha").isDate().withMessage("La fecha es requerida")], enviarRecordatoriosMasivos)
router.post("/preview", previewRecordatorio)
router.get("/template", obtenerTemplate)
router.put("/template", guardarTemplate)

module.exports = router
