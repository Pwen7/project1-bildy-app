import { z } from 'zod'

export const emailField = z.string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .toLowerCase()
    .trim()

export const passwordField = z.string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')

export const addressSchema = z.object({
    street: z.string().trim().min(1, 'Street is required'),
    number: z.string().trim().optional(),
    postal: z.string().trim().optional(),
    city: z.string().trim().min(1, 'City is required'),
    province: z.string().trim().min(1, 'Province is required'),
})
