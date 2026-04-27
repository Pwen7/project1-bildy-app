import mongoose from 'mongoose'

const workerSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Worker name is required'], trim: true },
  hours: { type: Number, min: [0, 'Hours cannot be negative'] }
}, { _id: false })

const deliveryNoteSchema = new mongoose.Schema({
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
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project reference is required'],
    index: true
  },
  format: {
    type: String,
    enum: ['material', 'hours'],
  },
  description: {
    type: String,
    trim: true
  },
  workDate: {
    type: Date,
    required: [true, 'Work date is required']
  },
  // material format
  material: { type: String, trim: true },
  quantity: { type: Number, min: [0, 'Quantity cannot be negative'] },
  unit: { type: String, trim: true },
  // hours format
  hours: { type: Number, min: [0, 'Hours cannot be negative'] },
  workers: [workerSchema],
  // signature
  signed: {
    type: Boolean,
    default: false,
    index: true
  },
  signedAt: {
    type: Date
  },
  signatureUrl: {
    type: String
  },
  pdfUrl: {
    type: String
  },
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  versionKey: false
})

const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema)
export default DeliveryNote
