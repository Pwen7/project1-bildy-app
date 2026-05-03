import multer from 'multer'
import AppError from '../utils/AppError.js'

const MAX_SIZE_MB = 5

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(AppError.badRequest('Only JPEG, JPG, PNG and WebP images are allowed'), false)
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024,
    files: 1
  }
})

export default upload
