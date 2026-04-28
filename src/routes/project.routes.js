import { Router } from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import validate from '../middlewares/validate.middleware.js'
import { createProjectSchema, projectSchema } from '../validators/project.validator.js'
import {
  createProject,
  deleteProject,
  getArchivedProjects,
  getProjectById,
  getProjects,
  restoreProject,
  updateProject
} from '../controllers/project.controller.js'

const router = Router()

router.use(authMiddleware)

router.post('/', validate(createProjectSchema), createProject)

router.get('/', getProjects)
router.get('/archived', getArchivedProjects)
router.get('/:id', getProjectById)

router.put('/:id', validate(projectSchema), updateProject)

router.delete('/:id', deleteProject)

router.patch('/:id/restore', restoreProject)

export default router
