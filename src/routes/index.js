import { Router } from 'express'
import clientRoutes from './client.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import deliveryNoteRoutes from './deliverynote.routes.js'
import projectRoutes from './project.routes.js'
import userRoutes from './user.routes.js'

const router = Router()

router.use('/user', userRoutes)
router.use('/client', clientRoutes)
router.use('/project', projectRoutes)
router.use('/deliverynote', deliveryNoteRoutes)
router.use('/dashboard', dashboardRoutes)

export default router
