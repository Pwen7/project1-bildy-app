import { z } from 'zod'
import { listQuerySchema, objectIdField, booleanCoerce, isoDateField } from './shared/query.js'

const workerSchema = z.object({
  name: z.string().trim().min(1, 'Worker name is required'),
  hours: z.number().min(0, 'Hours must be positive')
})

const materialNoteSchema = z.object({
  project: z.string().min(1, 'Project ID is required'),
  client: z.string().min(1, 'Client ID is required'),
  format: z.literal('material'),
  description: z.string().trim().optional(),
  workDate: z.coerce.date(),
  material: z.string().trim().min(1, 'Material is required'),
  quantity: z.number().min(0, 'Quantity must be positive'),
  unit: z.string().trim().min(1, 'Unit is required')
})

const hoursNoteSchema = z.object({
  project: z.string().min(1, 'Project ID is required'),
  client: z.string().min(1, 'Client ID is required'),
  format: z.literal('hours'),
  description: z.string().trim().optional(),
  workDate: z.coerce.date(),
  hours: z.number().min(0, 'Hours must be positive').optional(),
  workers: z.array(workerSchema).optional()
}).refine(
  (data) => data.hours !== undefined || (data.workers && data.workers.length > 0),
  { message: 'Either hours or workers must be provided', path: ['hours'] }
)

export const deliveryNoteSchema = z.discriminatedUnion('format', [
  materialNoteSchema,
  hoursNoteSchema
])

export const deliveryNoteListQuerySchema = listQuerySchema.extend({
  project: objectIdField.optional(),
  client: objectIdField.optional(),
  format: z.enum(['material', 'hours']).optional(),
  signed: booleanCoerce.optional(),
  from: isoDateField.optional(),
  to: isoDateField.optional()
})
