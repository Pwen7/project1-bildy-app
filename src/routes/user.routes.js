import { Router } from 'express'
import {
    changePasswordSchema,
    inviteSchema,
    loginSchema,
    personalDataSchema,
    refreshSchema,
    registerSchema,
    verificationSchema
} from '../validators/user.validator.js'
import { companySchema } from '../validators/company.validator.js'
import {
    changePassword,
    deleteUser,
    getUser,
    inviteUser,
    loginUser,
    logoutUser,
    refreshToken,
    registerUser,
    updateUserData,
    uploadLogo,
    upsertCompany,
    verifyEmail
} from '../controllers/user.controller.js'
import authMiddleware from '../middlewares/auth.middleware.js'
import validate from '../middlewares/validate.middleware.js'
import upload from '../middlewares/upload.middleware.js'
import checkRole from '../middlewares/role.middleware.js'

const router = Router()

// Public
router.post('/register', validate(registerSchema), registerUser)
router.post('/login', validate(loginSchema), loginUser)
router.post('/refresh', validate(refreshSchema), refreshToken)

// jwt
router.put('/validation', authMiddleware, validate(verificationSchema), verifyEmail)
router.put('/register', authMiddleware, validate(personalDataSchema), updateUserData)
router.patch('/company', authMiddleware, validate(companySchema), upsertCompany)
router.patch('/logo', authMiddleware, upload.single('logo'), uploadLogo)
router.get('/', authMiddleware, getUser)
router.post('/logout', authMiddleware, logoutUser)
router.delete('/', authMiddleware, deleteUser)
router.put('/password', authMiddleware, validate(changePasswordSchema), changePassword)

// jwt + admin role
router.post('/invite', authMiddleware, checkRole(['admin']), validate(inviteSchema), inviteUser)

export default router
