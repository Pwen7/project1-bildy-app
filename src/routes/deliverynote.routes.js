import { Router } from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import validate from '../middlewares/validate.middleware.js'
import { deliveryNoteSchema } from '../validators/deliverynote.validator.js'
import upload from '../middlewares/upload.middleware.js'
import {
  createDeliveryNote,
  deleteDeliveryNote,
  getDeliveryNoteById,
  getDeliveryNotePDF,
  getDeliveryNotes,
  signDeliveryNote
} from '../controllers/deliverynote.controller.js'

const router = Router()

router.use(authMiddleware)

router.post('/', validate(deliveryNoteSchema), createDeliveryNote)

router.get('/', getDeliveryNotes)
router.get('/pdf/:id', getDeliveryNotePDF)
router.get('/:id', getDeliveryNoteById)

router.patch('/:id/sign', upload.single('signature'), signDeliveryNote)

router.delete('/:id', deleteDeliveryNote)

export default router
