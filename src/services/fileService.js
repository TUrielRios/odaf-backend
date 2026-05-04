const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage Configuration for general files (including PDFs)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'odaf/archivos_pacientes',
    resource_type: 'auto', // Important to support PDFs and other formats
    public_id: (req, file) => {
      const patientId = req.body.paciente_id || 'unknown';
      const cleanName = file.originalname.split('.')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase();
      return `paciente_${patientId}_${cleanName}_${Date.now()}`;
    }
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = {
  cloudinary,
  upload
};
