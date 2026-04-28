import { Router } from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import validate from '../middlewares/validate.middleware.js'
import { createClientSchema, clientSchema } from '../validators/client.validator.js'
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


router.post('/', validate(createClientSchema), createClient)

router.get('/', getClients)
router.get('/archived', getArchivedClients)
router.get('/:id', getClientById)

router.put('/:id', validate(clientSchema), updateClient)

router.delete('/:id', deleteClient)

router.patch('/:id/restore', restoreClient)

export default router
