import { z } from 'zod'
import { addressSchema, emailField } from './shared/fields.js'

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required'),
  projectCode: z.string().trim().min(1, 'Project code is required'),
  client: z.string().min(1, 'Client ID is required'),
  address: addressSchema.optional(),
  email: emailField.optional(),
  notes: z.string().trim().optional(),
  active: z.boolean().optional().default(true)
})

export const projectSchema = createProjectSchema.partial()
