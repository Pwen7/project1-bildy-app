import DeliveryNote from '../models/DeliveryNote.js'
import Project from '../models/Project.js'
import Client from '../models/Client.js'
import AppError from '../utils/AppError.js'
import { uploadToCloud } from '../services/storage.service.js'
import { generateDeliveryNotePDF } from '../services/pdf.service.js'
import { getIO } from '../services/socket.service.js'

// POST /api/deliverynote
export const createDeliveryNote = async (req, res, next) => {
  try {
    const { _id: user, company } = req.user
    const { project: projectId, client: clientId, format, description, workDate, material, quantity, unit, hours, workers } = req.body

    if (!company) throw AppError.badRequest('You must have a company to create delivery notes')

    const [project, client] = await Promise.all([
      Project.findOne({ _id: projectId, company, deleted: false }),
      Client.findOne({ _id: clientId, company, deleted: false })
    ])

    if (!project) throw AppError.notFound('Project')
    if (!client) throw AppError.notFound('Client')

    const note = await DeliveryNote.create({
      user, company,
      client: clientId, project: projectId,
      format, description, workDate,
      material, quantity, unit,
      hours, workers
    })

    getIO().to(company.toString()).emit('deliverynote:new', { note })

    res.status(201).json({ error: false, data: { note } })
  } catch (error) {
    next(error)
  }
}

// GET /api/deliverynote
export const getDeliveryNotes = async (req, res, next) => {
  try {
    const { company } = req.user
    const { page = 1, limit = 10, project, client, format, signed, from, to, sort = '-workDate' } = req.query

    const filter = { company, deleted: false }
    if (project) filter.project = project
    if (client) filter.client = client
    if (format) filter.format = format
    if (signed !== undefined) filter.signed = signed === 'true'
    if (from || to) {
      filter.workDate = {}
      if (from) filter.workDate.$gte = new Date(from)
      if (to) filter.workDate.$lte = new Date(to)
    }

    const skip = (Number(page) - 1) * Number(limit)
    const [notes, totalItems] = await Promise.all([
      DeliveryNote.find(filter)
        .populate('user', 'name lastName email')
        .populate('client', 'name cif')
        .populate('project', 'name projectCode')
        .sort(sort).skip(skip).limit(Number(limit)),
      DeliveryNote.countDocuments(filter)
    ])

    res.json({
      error: false,
      data: {
        notes,
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

// GET /api/deliverynote/:id
export const getDeliveryNoteById = async (req, res, next) => {
  try {
    const { id } = req.params
    const { company } = req.user

    const note = await DeliveryNote.findOne({ _id: id, company, deleted: false })
      .populate('user', 'name lastName email nif')
      .populate('client', 'name cif email phone address')
      .populate('project', 'name projectCode address email')
      .populate('company')

    if (!note) throw AppError.notFound('Delivery note')

    res.json({ error: false, data: { note } })
  } catch (error) {
    next(error)
  }
}

// GET /api/deliverynote/pdf/:id
export const getDeliveryNotePDF = async (req, res, next) => {
  try {
    const { id } = req.params
    const { _id: userId, company } = req.user

    const note = await DeliveryNote.findOne({ _id: id, company, deleted: false })
      .populate('user', 'name lastName email nif')
      .populate('client', 'name cif email phone address')
      .populate('project', 'name projectCode address email')
      .populate('company')

    if (!note) throw AppError.notFound('Delivery note')

    if (note.signed && note.pdfUrl) {
      return res.redirect(note.pdfUrl)
    }

    const pdfBuffer = await generateDeliveryNotePDF(note)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="albaran-${note._id}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

// PATCH /api/deliverynote/:id/sign
export const signDeliveryNote = async (req, res, next) => {
  try {
    const { id } = req.params
    const { company } = req.user

    if (!req.file) throw AppError.badRequest('Signature image is required')

    const note = await DeliveryNote.findOne({ _id: id, company, deleted: false })
      .populate('user', 'name lastName email nif')
      .populate('client', 'name cif email phone address')
      .populate('project', 'name projectCode address email')
      .populate('company')

    if (!note) throw AppError.notFound('Delivery note')
    if (note.signed) throw AppError.badRequest('Delivery note is already signed')

    const signatureUrl = await uploadToCloud(req.file, { folder: 'signatures' })

    note.signatureUrl = signatureUrl
    const pdfBuffer = await generateDeliveryNotePDF(note)

    const pdfUrl = await uploadToCloud(
      { buffer: pdfBuffer, mimetype: 'application/pdf', originalname: `albaran-${note._id}.pdf` },
      { folder: 'delivery-notes', resource_type: 'raw' }
    )

    const updated = await DeliveryNote.findByIdAndUpdate(
      id,
      { signed: true, signedAt: new Date(), signatureUrl, pdfUrl },
      { new: true }
    )

    getIO().to(company.toString()).emit('deliverynote:signed', { note: updated })

    res.json({ error: false, data: { note: updated } })
  } catch (error) {
    next(error)
  }
}

// DELETE /api/deliverynote/:id
export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const { id } = req.params
    const { company } = req.user

    const note = await DeliveryNote.findOne({ _id: id, company, deleted: false })
    if (!note) throw AppError.notFound('Delivery note')
    if (note.signed) throw AppError.badRequest('Signed delivery notes cannot be deleted')

    await DeliveryNote.findByIdAndDelete(id)

    res.json({ error: false, message: 'Delivery note deleted' })
  } catch (error) {
    next(error)
  }
}
