import { Router } from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import { getDashboard } from '../controllers/dashboard.controller.js'

const router = Router()

router.use(authMiddleware)

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Aggregated statistics for the authenticated user's company
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get aggregated statistics (notes per month, hours per project, materials per client, counters)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated dashboard payload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: boolean, example: false }
 *                 data: { $ref: '#/components/schemas/Dashboard' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', getDashboard)

export default router
