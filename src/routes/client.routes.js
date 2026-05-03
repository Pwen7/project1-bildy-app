import { Router } from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import validate from '../middlewares/validate.middleware.js'
import { createClientSchema, clientSchema, clientListQuerySchema } from '../validators/client.validator.js'
import {
  createClient,
  deleteClient,
  getArchivedClients,
  getClientById,
  getClients,
  restoreClient,
  updateClient
} from '../controllers/client.controller.js'

const router = Router()

router.use(authMiddleware)

/**
 * @swagger
 * tags:
 *   name: Client
 *   description: Client management
 */

/**
 * @swagger
 * /api/client:
 *   post:
 *     tags: [Client]
 *     summary: Create a client
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClient'
 *     responses:
 *       201:
 *         description: Client created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   get:
 *     tags: [Client]
 *     summary: List clients (paginated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of clients
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validate(createClientSchema), createClient)
router.get('/', validate(clientListQuerySchema, 'query'), getClients)

/**
 * @swagger
 * /api/client/archived:
 *   get:
 *     tags: [Client]
 *     summary: List soft-deleted clients
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archived clients
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/archived', validate(clientListQuerySchema, 'query'), getArchivedClients)

/**
 * @swagger
 * /api/client/{id}:
 *   get:
 *     tags: [Client]
 *     summary: Get client by ID
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
 *         description: Client data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   put:
 *     tags: [Client]
 *     summary: Update client
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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClient'
 *     responses:
 *       200:
 *         description: Client updated
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     tags: [Client]
 *     summary: Delete client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *         description: Archive instead of hard delete
 *     responses:
 *       200:
 *         description: Client deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', getClientById)
router.put('/:id', validate(clientSchema), updateClient)
router.delete('/:id', deleteClient)

/**
 * @swagger
 * /api/client/{id}/restore:
 *   patch:
 *     tags: [Client]
 *     summary: Restore a soft-deleted client
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
 *         description: Client restored
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/:id/restore', restoreClient)

export default router
