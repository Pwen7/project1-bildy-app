import { z } from 'zod'

export const objectIdField = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId')

// strings (and booleans) to boolean
export const booleanCoerce = z
  .union([z.boolean(), z.literal('true'), z.literal('false')])
  .transform((v) => v === true || v === 'true')

export const isoDateField = z.string().refine(
  (s) => !Number.isNaN(Date.parse(s)),
  'Invalid ISO date'
)

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sort: z.string().trim().optional()
})
