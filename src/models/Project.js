import mongoose from 'mongoose'
import addressSchema from './address.model.js'

const clientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company reference is required'],
    index: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client reference is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  projectCode: {
    type: String,
    required: [true, 'Project code is required'],
    trim: true,
  },
  addressSchema: addressSchema,
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  notes: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  versionKey: false
})

clientSchema.index({ company: 1, projectCode: 1 }, { unique: true })

const Project = mongoose.model('Project', clientSchema)
export default Project
