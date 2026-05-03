import { jest } from '@jest/globals'

jest.unstable_mockModule('../src/services/logger.service.js', () => ({
  notifySlack: jest.fn().mockResolvedValue(undefined)
}))

const mongoose = (await import('mongoose')).default
const { z } = await import('zod')
const { errorHandler, notFound } = await import('../src/middlewares/error.middleware.js')
const { default: AppError } = await import('../src/utils/AppError.js')
const { notifySlack } = await import('../src/services/logger.service.js')

const buildRes = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const buildReq = () => ({ method: 'GET', originalUrl: '/api/test' })

afterEach(() => jest.clearAllMocks())

describe('errorHandler — branches', () => {
  it('Zod validation error → 400 with details', async () => {
    const schema = z.object({ email: z.string().email() })
    const result = schema.safeParse({ email: 'not-an-email' })
    expect(result.success).toBe(false)

    const res = buildRes()
    await errorHandler(result.error, buildReq(), res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      message: 'Zod validation error',
      details: expect.any(Array)
    }))
  })

  it('Mongoose CastError → 400 with field path', async () => {
    const err = new mongoose.Error.CastError('ObjectId', 'bad-id', 'id')
    const res = buildRes()
    await errorHandler(err, buildReq(), res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      message: expect.stringContaining("'id'")
    }))
  })

  it('Duplicate-key error (code 11000) → 409', async () => {
    const err = { code: 11000, keyValue: { email: 'dup@test.com' } }
    const res = buildRes()
    await errorHandler(err, buildReq(), res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      message: expect.stringContaining('email')
    }))
  })

  it('Multer LIMIT_FILE_SIZE → 400', async () => {
    const err = { code: 'LIMIT_FILE_SIZE' }
    const res = buildRes()
    await errorHandler(err, buildReq(), res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      message: expect.stringContaining('5MB')
    }))
  })

  it('AppError (operational) → forwards statusCode and message', async () => {
    const err = AppError.notFound('Widget')
    const res = buildRes()
    await errorHandler(err, buildReq(), res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      message: expect.stringContaining('Widget')
    }))
  })

  it('Generic fallback → 500 and notifies Slack', async () => {
    const err = new Error('boom')
    const res = buildRes()
    await errorHandler(err, buildReq(), res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(500)
    expect(notifySlack).toHaveBeenCalledTimes(1)
  })
})

describe('notFound', () => {
  it('responds with 404 and method/path information', () => {
    const res = buildRes()
    notFound({ method: 'GET', originalUrl: '/missing' }, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      message: expect.stringContaining('/missing')
    }))
  })
})
