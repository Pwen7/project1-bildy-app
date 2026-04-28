import Project from '../models/Project.js'
import Client from '../models/Client.js'
import AppError from '../utils/AppError.js'
import { getIO } from '../services/socket.service.js'

// POST /api/project
export const createProject = async (req, res, next) => {
  try {
    const { name, projectCode, client: clientId, address, email, notes, active } = req.body
    const { _id: user, company } = req.user

    if (!company) throw AppError.badRequest('You must have a company to create projects')

    const client = await Client.findOne({ _id: clientId, company, deleted: false })
    if (!client) throw AppError.notFound('Client')

    const exists = await Project.findOne({ projectCode, company, deleted: false })
    if (exists) throw AppError.conflict(`A project with code ${projectCode} already exists`)

    const project = await Project.create({
      user, company, client: clientId,
      name, projectCode, address, email, notes, active
    })

    getIO().to(company.toString()).emit('project:new', { project })

    res.status(201).json({ error: false, data: { project } })
  } catch (error) {
    next(error)
  }
}

// PUT /api/project/:id
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params
    const { company } = req.user

    const project = await Project.findOne({ _id: id, company, deleted: false })
    if (!project) throw AppError.notFound('Project')

    if (req.body.projectCode && req.body.projectCode !== project.projectCode) {
      const exists = await Project.findOne({ projectCode: req.body.projectCode, company, deleted: false })
      if (exists) throw AppError.conflict(`A project with code ${req.body.projectCode} already exists`)
    }

    if (req.body.client) {
      const client = await Client.findOne({ _id: req.body.client, company, deleted: false })
      if (!client) throw AppError.notFound('Client')
    }

    const updated = await Project.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })

    res.json({ error: false, data: { project: updated } })
  } catch (error) {
    next(error)
  }
}

// GET /api/project
export const getProjects = async (req, res, next) => {
  try {
    const { company } = req.user
    const { page = 1, limit = 10, name, client, active, sort = '-createdAt' } = req.query

    const filter = { company, deleted: false }
    if (name) filter.name = { $regex: name, $options: 'i' }
    if (client) filter.client = client
    if (active !== undefined) filter.active = active === 'true'

    const skip = (Number(page) - 1) * Number(limit)
    const [projects, totalItems] = await Promise.all([
      Project.find(filter).populate('client', 'name cif').sort(sort).skip(skip).limit(Number(limit)),
      Project.countDocuments(filter)
    ])

    res.json({
      error: false,
      data: {
        projects,
        pagination: {
          totalItems,
          totalPages: Math.ceil(totalItems / Number(limit)),
          currentPage: Number(page)
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/project/archived
export const getArchivedProjects = async (req, res, next) => {
  try {
    const { company } = req.user
    const { page = 1, limit = 10 } = req.query

    const filter = { company, deleted: true }
    const skip = (Number(page) - 1) * Number(limit)
    const [projects, totalItems] = await Promise.all([
      Project.find(filter).populate('client', 'name cif').sort('-updatedAt').skip(skip).limit(Number(limit)),
      Project.countDocuments(filter)
    ])

    res.json({
      error: false,
      data: {
        projects,
        pagination: {
          totalItems,
          totalPages: Math.ceil(totalItems / Number(limit)),
          currentPage: Number(page)
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/project/:id
export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params
    const { company } = req.user

    const project = await Project.findOne({ _id: id, company, deleted: false })
      .populate('client', 'name cif email')
    if (!project) throw AppError.notFound('Project')

    res.json({ error: false, data: { project } })
  } catch (error) {
    next(error)
  }
}

// DELETE /api/project/:id  ?soft=true
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params
    const { company } = req.user
    const soft = req.query.soft === 'true'

    const project = await Project.findOne({ _id: id, company, deleted: false })
    if (!project) throw AppError.notFound('Project')

    if (soft) {
      await Project.findByIdAndUpdate(id, { deleted: true })
    } else {
      await Project.findByIdAndDelete(id)
    }

    res.json({ error: false, message: soft ? 'Project archived' : 'Project permanently deleted' })
  } catch (error) {
    next(error)
  }
}

// PATCH /api/project/:id/restore
export const restoreProject = async (req, res, next) => {
  try {
    const { id } = req.params
    const { company } = req.user

    const project = await Project.findOne({ _id: id, company, deleted: true })
    if (!project) throw AppError.notFound('Archived project')

    await Project.findByIdAndUpdate(id, { deleted: false })

    res.json({ error: false, message: 'Project restored successfully' })
  } catch (error) {
    next(error)
  }
}
