const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.resolve(__dirname, '../../uploads/receipts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + ext);
  }
});

const allowedMimes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'image/pjpeg',
  'image/x-png',
  'image/heic',
  'image/heif'
];

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase().split(';')[0].trim();

  const isAllowedMime = allowedMimes.includes(mime) || mime.startsWith('image/');
  const isAllowedExt = allowedExtensions.includes(ext);

  // If MIME is recognized image OR generic octet-stream with valid image extension/name
  if (isAllowedMime || (isAllowedExt && (mime === 'application/octet-stream' || !mime))) {
    // Normalise mimetype if it came as octet-stream or empty
    if (mime === 'application/octet-stream' || !mime) {
      if (ext === '.png') file.mimetype = 'image/png';
      else if (ext === '.webp') file.mimetype = 'image/webp';
      else if (ext === '.heic' || ext === '.heif') file.mimetype = 'image/heic';
      else file.mimetype = 'image/jpeg';
    }
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP or HEIC images are permitted as receipt evidence.'), false);
  }
};

const uploadReceipt = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max for high-res mobile photos
  fileFilter: fileFilter
});

module.exports = {
  uploadReceipt
};
