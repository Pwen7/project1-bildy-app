import { z } from 'zod'
import { emailField, passwordField } from './shared/fields.js'

export const registerSchema = z.object({
    email: emailField,
    password: passwordField,
})

export const verificationSchema = z.object({
    code: z.string()
        .length(6, 'Code must be 6 digits')
        .regex(/^\d{6}$/, 'Code must contain only digits'),
})

export const loginSchema = z.object({
    email: emailField,
    password: z.string({ required_error: 'Password is required' }).min(1),
})

export const personalDataSchema = z.object({
    name: z.string().trim().min(1, 'Name is required'),
    lastName: z.string().trim().min(1, 'Lastname is required'),
    nif: z.string().trim().min(1, 'NIF is required').toUpperCase(),
})

export const refreshSchema = z.object({
    refreshToken: z.string({ required_error: 'refreshToken is required' }).min(1),
})

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: passwordField,
    })
    .refine(
        (data) => data.currentPassword !== data.newPassword,
        {
            message: 'New password must be different from current password',
            path: ['newPassword'],
        }
    )

export const inviteSchema = z.object({
    email: emailField,
    name: z.string().trim().min(1, 'Name is required'),
    lastName: z.string().trim().min(1, 'Lastname is required'),
    password: passwordField,
})
