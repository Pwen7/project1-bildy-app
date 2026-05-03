import { z } from 'zod'

// 24-character hex string (MongoDB ObjectId)
export const objectIdField = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId')

// Coerces "true"/"false" strings (and booleans) to boolean
export const booleanCoerce = z
  .union([z.boolean(), z.literal('true'), z.literal('false')])
  .transform((v) => v === true || v === 'true')

// ISO date string (YYYY-MM-DD or full ISO 8601)
export const isoDateField = z.string().refine(
  (s) => !Number.isNaN(Date.parse(s)),
  'Invalid ISO date'
)

// Common pagination + sort fields used by every listing endpoint
export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sort: z.string().trim().optional()
})
