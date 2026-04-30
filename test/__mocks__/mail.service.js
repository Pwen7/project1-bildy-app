import { jest } from '@jest/globals'

export const sendVerificationEmail = jest.fn().mockResolvedValue({ messageId: 'test-mock' })
