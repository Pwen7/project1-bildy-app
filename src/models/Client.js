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
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  cif: {
    type: String,
    required: [true, 'CIF is required'],
    trim: true,
    uppercase: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: addressSchema,
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  versionKey: false
})

clientSchema.index({ company: 1, cif: 1 }, { unique: true })

const Client = mongoose.model('Client', clientSchema)
export default Client
