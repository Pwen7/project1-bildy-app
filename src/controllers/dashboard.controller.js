import mongoose from 'mongoose'
import DeliveryNote from '../models/DeliveryNote.js'
import Project from '../models/Project.js'

// GET /api/dashboard
export const getDashboard = async (req, res, next) => {
  try {
    const { company } = req.user
    if (!company) {
      return res.json({
        error: false,
        data: {
          notesPerMonth: [],
          hoursPerProject: [],
          materialsPerClient: [],
          counters: { signed: 0, unsigned: 0, activeProjects: 0, archivedProjects: 0 }
        }
      })
    }

    const companyId = new mongoose.Types.ObjectId(company)

    const [notesPerMonth, hoursPerProject, materialsPerClient, signedCounts, projectCounts] = await Promise.all([
      // Notes per month
      DeliveryNote.aggregate([
        { $match: { company: companyId, deleted: false } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$workDate' } },
            count: { $sum: 1 }
          }
        },
        { $project: { _id: 0, month: '$_id', count: 1 } },
        { $sort: { month: 1 } }
      ]),
      // Hours per project
      DeliveryNote.aggregate([
        { $match: { company: companyId, deleted: false, format: 'hours' } },
        {
          $group: {
            _id: '$project',
            hours: { $sum: { $ifNull: ['$hours', 0] } }
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: '_id',
            foreignField: '_id',
            as: 'project'
          }
        },
        { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            projectId: '$_id',
            projectName: '$project.name',
            projectCode: '$project.projectCode',
            hours: 1
          }
        },
        { $sort: { hours: -1 } }
      ]),
      // Materials per client
      DeliveryNote.aggregate([
        { $match: { company: companyId, deleted: false, format: 'material' } },
        {
          $group: {
            _id: '$client',
            quantities: { $push: '$quantity' },
            units: { $push: '$unit' }
          }
        },
        {
          $lookup: {
            from: 'clients',
            localField: '_id',
            foreignField: '_id',
            as: 'client'
          }
        },
        { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            clientId: '$_id',
            clientName: '$client.name',
            clientCif: '$client.cif',
            quantities: 1,
            units: 1
          }
        }
      ]),
      // signed/unsigned notes
      DeliveryNote.aggregate([
        { $match: { company: companyId, deleted: false } },
        { $group: { _id: '$signed', count: { $sum: 1 } } }
      ]),
      // active/archived projects
      Project.aggregate([
        { $match: { company: companyId } },
        {
          $group: {
            _id: { active: '$active', deleted: '$deleted' },
            count: { $sum: 1 }
          }
        }
      ])
    ])

    const signed = signedCounts.find(c => c._id === true)?.count || 0
    const unsigned = signedCounts.find(c => c._id === false)?.count || 0
    const activeProjects = projectCounts
      .filter(c => c._id.active === true && c._id.deleted === false)
      .reduce((sum, c) => sum + c.count, 0)
    const archivedProjects = projectCounts
      .filter(c => c._id.deleted === true)
      .reduce((sum, c) => sum + c.count, 0)

    res.json({
      error: false,
      data: {
        notesPerMonth,
        hoursPerProject,
        materialsPerClient,
        counters: { signed, unsigned, activeProjects, archivedProjects }
      }
    })
  } catch (error) {
    next(error)
  }
}
