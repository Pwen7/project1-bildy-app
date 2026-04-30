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

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management and authentication
 */

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     tags: [User]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: secret1234
 *     responses:
 *       201:
 *         description: User registered — verification email sent
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Public
router.post('/register', validate(registerSchema), registerUser)

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     tags: [User]
 *     summary: Login and receive access + refresh tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Access and refresh tokens
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/login', validate(loginSchema), loginUser)

/**
 * @swagger
 * /api/user/refresh:
 *   post:
 *     tags: [User]
 *     summary: Rotate refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access and refresh tokens
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/refresh', validate(refreshSchema), refreshToken)

/**
 * @swagger
 * /api/user/validation:
 *   put:
 *     tags: [User]
 *     summary: Verify email with 6-digit code (max 3 attempts)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 example: '123456'
 *     responses:
 *       200:
 *         description: Email verified
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/validation', authMiddleware, validate(verificationSchema), verifyEmail)

/**
 * @swagger
 * /api/user/register:
 *   put:
 *     tags: [User]
 *     summary: Update personal data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Juan
 *               lastName:
 *                 type: string
 *                 example: García
 *               nif:
 *                 type: string
 *                 example: 12345678A
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/register', authMiddleware, validate(personalDataSchema), updateUserData)

/**
 * @swagger
 * /api/user/company:
 *   patch:
 *     tags: [User]
 *     summary: Create company or join existing by CIF
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cif]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Construcciones García SL
 *               cif:
 *                 type: string
 *                 example: B12345678
 *               isFreelance:
 *                 type: boolean
 *               address:
 *                 $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Company created or joined
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/company', authMiddleware, validate(companySchema), upsertCompany)

/**
 * @swagger
 * /api/user/logo:
 *   patch:
 *     tags: [User]
 *     summary: Upload company logo (multipart/form-data)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo uploaded
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/logo', authMiddleware, upload.single('logo'), uploadLogo)

/**
 * @swagger
 * /api/user:
 *   get:
 *     tags: [User]
 *     summary: Get own profile (populated company)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     tags: [User]
 *     summary: Delete account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *         description: Archive instead of hard delete
 *     responses:
 *       200:
 *         description: Account deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', authMiddleware, getUser)
router.delete('/', authMiddleware, deleteUser)

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     tags: [User]
 *     summary: Invalidate refresh token (logout)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/logout', authMiddleware, logoutUser)

/**
 * @swagger
 * /api/user/password:
 *   put:
 *     tags: [User]
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/password', authMiddleware, validate(changePasswordSchema), changePassword)

/**
 * @swagger
 * /api/user/invite:
 *   post:
 *     tags: [User]
 *     summary: Invite a user to the company (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Invitation sent
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/invite', authMiddleware, checkRole(['admin']), validate(inviteSchema), inviteUser)

export default router
