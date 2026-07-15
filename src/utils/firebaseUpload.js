const { bucket } = require("../config/firebase")

// Errores de red transitorios (corte de conexión con googleapis al pedir el
// token OAuth o al subir). No dependen de nuestros datos: reintentar suele
// resolverlos.
const TRANSIENT_ERROR_CODES = new Set([
  "ERR_STREAM_PREMATURE_CLOSE",
  "ECONNRESET",
  "ETIMEDOUT",
  "EPIPE",
  "ENOTFOUND",
])

function isTransient(error) {
  const code = error?.code || error?.cause?.code
  if (TRANSIENT_ERROR_CODES.has(code)) return true
  return /premature close|socket hang up/i.test(error?.message || "")
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function uploadToFirebase(file, pathPrefix, { retries = 3 } = {}) {
  const fileName = `${pathPrefix}/${Date.now()}_${file.originalname}`

  let lastError
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const blob = bucket.file(fileName)
      // resumable: false => una sola petición (simple upload). Evita el POST
      // extra de creación de sesión resumable, que es donde se corta la
      // conexión en el deploy. Ideal para archivos chicos (≤10 MB).
      await blob.save(file.buffer, {
        resumable: false,
        contentType: file.mimetype,
      })
      await blob.makePublic()
      return `https://storage.googleapis.com/${bucket.name}/${blob.name}`
    } catch (error) {
      lastError = error
      if (attempt < retries && isTransient(error)) {
        const backoff = 500 * 2 ** (attempt - 1) // 500ms, 1s, 2s...
        console.warn(
          `Subida a Firebase falló (intento ${attempt}/${retries}): ${error.code || error.message}. Reintentando en ${backoff}ms.`
        )
        await sleep(backoff)
        continue
      }
      throw error
    }
  }
  throw lastError
}

async function deleteFromFirebase(url) {
  try {
    const pathSegments = url.split("https://storage.googleapis.com/")[1].split("/")
    const bucketName = pathSegments[0]
    const filePath = pathSegments.slice(1).join("/").split("?")[0]

    if (bucketName !== bucket.name) {
      console.warn(`Bucket incorrecto: ${bucketName}. Esperado: ${bucket.name}`)
      return
    }

    const file = bucket.file(filePath)
    const [exists] = await file.exists()

    if (exists) {
      await file.delete()
    }
  } catch (error) {
    console.error(`Error al eliminar archivo de Firebase:`, error)
  }
}

module.exports = {
  uploadToFirebase,
  deleteFromFirebase,
}
