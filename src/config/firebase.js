const admin = require("firebase-admin")

if (!admin.apps.length) {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64

  if (!base64) {
    throw new Error("La variable de entorno FIREBASE_SERVICE_ACCOUNT_BASE64 no está definida.")
  }

  const serviceAccount = JSON.parse(Buffer.from(base64, "base64").toString("utf8"))

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://dame-un-turnito.firebasestorage.app",
  })
}

const bucket = admin.storage().bucket()

module.exports = { bucket, admin }
