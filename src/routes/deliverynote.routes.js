import { Router } from 'express'
import {
  createDeliveryNote,
  deleteDeliveryNote,
  getDeliveryNoteById,
  getDeliveryNotePDF,
  getDeliveryNotes,
  signDeliveryNote
} from '../controllers/deliverynote.controller.js'
import authMiddleware from '../middlewares/auth.middleware.js'
import upload from '../middlewares/upload.middleware.js'
import validate from '../middlewares/validate.middleware.js'
import { deliveryNoteListQuerySchema, deliveryNoteSchema } from '../validators/deliverynote.validator.js'

const router = Router()

router.use(authMiddleware)

/**
 * @swagger
 * tags:
 *   name: DeliveryNote
 *   description: Delivery note (albarán) management
 */

/**
 * @swagger
 * /api/deliverynote:
 *   post:
 *     tags: [DeliveryNote]
 *     summary: Create a delivery note
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDeliveryNote'
 *     responses:
 *       201:
 *         description: Delivery note created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   get:
 *     tags: [DeliveryNote]
 *     summary: List delivery notes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *         description: Filter by client ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [material, hours]
 *       - in: query
 *         name: signed
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Work date from (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Work date to (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of delivery notes
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validate(deliveryNoteSchema), createDeliveryNote)
router.get('/', validate(deliveryNoteListQuerySchema, 'query'), getDeliveryNotes)

/**
 * @swagger
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     tags: [DeliveryNote]
 *     summary: Download PDF — streams if unsigned, redirects to cloud URL if signed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF file stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       302:
 *         description: Redirect to cloud-stored PDF URL
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/pdf/:id', getDeliveryNotePDF)

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   get:
 *     tags: [DeliveryNote]
 *     summary: Get delivery note by ID (fully populated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delivery note data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     tags: [DeliveryNote]
 *     summary: Delete delivery note (only if unsigned)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delivery note deleted
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', getDeliveryNoteById)
router.delete('/:id', deleteDeliveryNote)

/**
 * @swagger
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     tags: [DeliveryNote]
 *     summary: Sign delivery note — upload signature image, generate and store PDF
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Delivery note signed, PDF stored
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/:id/sign', upload.single('signature'), signDeliveryNote)

export default router
