import Client from '../models/Client.js'
import AppError from '../utils/AppError.js'
import { getIO } from '../services/socket.service.js'

// POST /api/client
export const createClient = async (req, res, next) => {
  try {
    const { name, cif, email, phone, address } = req.body
    const { _id: user, company } = req.user

    if (!company) throw AppError.badRequest('You must have a company to create clients')

    const exists = await Client.findOne({ cif, company, deleted: false })
    if (exists) throw AppError.conflict(`A client with CIF ${cif} already exists in your company`)

    const client = await Client.create({ user, company, name, cif, email, phone, address })

    getIO().to(company.toString()).emit('client:new', { client })

    res.status(201).json({ error: false, data: { client } })
  } catch (error) {
    next(error)
  }
}

// PUT /api/client/:id
export const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params
    const { company } = req.user

    const client = await Client.findOne({ _id: id, company, deleted: false })
    if (!client) throw AppError.notFound('Client')

    if (req.body.cif && req.body.cif !== client.cif) {
      const exists = await Client.findOne({ cif: req.body.cif, company, deleted: false })
      if (exists) throw AppError.conflict(`A client with CIF ${req.body.cif} already exists`)
    }

    const updated = await Client.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })

    res.json({ error: false, data: { client: updated } })
  } catch (error) {
    next(error)
  }
}

// GET /api/client
export const getClients = async (req, res, next) => {
  try {
    const { company } = req.user
    const { page = 1, limit = 10, name, sort = '-createdAt' } = req.query

    const filter = { company, deleted: false }
    if (name) filter.name = { $regex: name, $options: 'i' }

    const skip = (Number(page) - 1) * Number(limit)
    const [clients, totalItems] = await Promise.all([
      Client.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Client.countDocuments(filter)
    ])

    res.json({
      error: false,
      data: {
        clients,
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

// GET /api/client/archived
export const getArchivedClients = async (req, res, next) => {
  try {
    const { company } = req.user
    const { page = 1, limit = 10 } = req.query

    const filter = { company, deleted: true }
    const skip = (Number(page) - 1) * Number(limit)
    const [clients, totalItems] = await Promise.all([
      Client.find(filter).sort('-updatedAt').skip(skip).limit(Number(limit)),
      Client.countDocuments(filter)
    ])

    res.json({
      error: false,
      data: {
        clients,
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

// GET /api/client/:id
export const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params
    const { company } = req.user

    const client = await Client.findOne({ _id: id, company, deleted: false })
    if (!client) throw AppError.notFound('Client')

    res.json({ error: false, data: { client } })
  } catch (error) {
    next(error)
  }
}

// DELETE /api/client/:id  ?soft=true
export const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params
    const { company } = req.user
    const soft = req.query.soft === 'true'

    const client = await Client.findOne({ _id: id, company, deleted: false })
    if (!client) throw AppError.notFound('Client')

    if (soft) {
      await Client.findByIdAndUpdate(id, { deleted: true })
    } else {
      await Client.findByIdAndDelete(id)
    }

    res.json({ error: false, message: soft ? 'Client archived' : 'Client permanently deleted' })
  } catch (error) {
    next(error)
  }
}

// PATCH /api/client/:id/restore
export const restoreClient = async (req, res, next) => {
  try {
    const { id } = req.params
    const { company } = req.user

    const client = await Client.findOne({ _id: id, company, deleted: true })
    if (!client) throw AppError.notFound('Archived client')

    await Client.findByIdAndUpdate(id, { deleted: false })

    res.json({ error: false, message: 'Client restored successfully' })
  } catch (error) {
    next(error)
  }
}
