import { z } from 'zod'
import { addressSchema } from './shared/fields.js'

const freelanceCompanySchema = z.object({
  isFreelance: z.literal(true),
  address: addressSchema.optional(),
})

const regularCompanySchema = z.object({
  isFreelance: z.literal(false).optional().default(false),
  name: z.string().trim().min(1, 'Company name is required'),
  cif: z.string().trim().min(1, 'CIF is required').toUpperCase(),
  address: addressSchema,
})

export const companySchema = z.discriminatedUnion('isFreelance', [
  freelanceCompanySchema,
  regularCompanySchema,
])
