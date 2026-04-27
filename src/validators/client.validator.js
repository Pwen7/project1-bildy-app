import { z } from 'zod'
import { addressSchema, emailField } from './shared/fields.js'

export const createClientSchema = z.object({
  name: z.string().trim().min(1, 'Client name is required'),
  cif: z.string().trim().min(1, 'CIF is required').toUpperCase(),
  email: emailField.optional(),
  phone: z.string().trim().optional(),
  address: addressSchema.optional()
})

export const clientSchema = createClientSchema.partial()
