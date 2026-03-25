import multer from 'multer'
import path from 'path'
import AppError from '../utils/AppError.js'

const MAX_SIZE_MB = 5

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        // Extracts file extension
        const ext = path.extname(file.originalname)
        const uniqueName = `logo-${req.user._id}-${Date.now()}${ext}`
        cb(null, uniqueName)
    }
})

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png']

    if (allowed.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(AppError.badRequest('Only JPEG, JPG and PNG images are allowed'), false)
    }
}

// Use: router.patch('/logo', authMiddleware, upload.single('logo'), uploadLogo)
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_SIZE_MB * 1024 * 1024,
        files: 1
    }
})

export default upload
