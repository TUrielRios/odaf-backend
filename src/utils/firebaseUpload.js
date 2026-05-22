const { bucket } = require("../config/firebase")

async function uploadToFirebase(file, pathPrefix) {
  const fileName = `${pathPrefix}/${Date.now()}_${file.originalname}`
  const blob = bucket.file(fileName)
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  })

  return new Promise((resolve, reject) => {
    blobStream.on("error", reject)
    blobStream.on("finish", async () => {
      await blob.makePublic()
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      resolve(publicUrl)
    })
    blobStream.end(file.buffer)
  })
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
