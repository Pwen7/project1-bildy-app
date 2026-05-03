import { jest } from '@jest/globals'

jest.unstable_mockModule('../src/services/mail.service.js', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ messageId: 'test-mock' })
}))

jest.unstable_mockModule('../src/services/socket.service.js', () => ({
  initSocket: jest.fn(),
  getIO: jest.fn(() => ({ to: jest.fn(() => ({ emit: jest.fn() })), close: jest.fn() }))
}))

jest.unstable_mockModule('../src/services/storage.service.js', () => ({
  uploadToCloud: jest.fn().mockResolvedValue('https://cloud.example.com/test-logo.webp')
}))

const request = (await import('supertest')).default
const { default: app } = await import('../src/app.js')
const { connect, closeDatabase, clearDatabase } = await import('./setup.js')

const USER = { email: 'logo@bildy.test', password: 'Password123' }
const LOGO_CO = { name: 'Logo SL', cif: 'B44444444', address: { street: 'Calle Logo', city: 'Madrid', province: 'Madrid' } }

beforeAll(async () => { await connect() })
afterEach(async () => { await clearDatabase() })
afterAll(async () => { await closeDatabase() })

describe('PATCH /api/user/logo', () => {
  it('200 — sube logo de la compañía y devuelve URL', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    await request(app).patch('/api/user/company').set('Authorization', `Bearer ${token}`).send(LOGO_CO)

    const res = await request(app)
      .patch('/api/user/logo')
      .set('Authorization', `Bearer ${token}`)
      .attach('logo', Buffer.from('fake-png-bytes'), { filename: 'logo.png', contentType: 'image/png' })

    expect(res.statusCode).toBe(200)
    expect(res.body.error).toBe(false)
    expect(res.body.data.logo).toMatch(/^https?:\/\//)
  })

  it('400 — sin fichero adjunto', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    await request(app).patch('/api/user/company').set('Authorization', `Bearer ${token}`).send(LOGO_CO)

    const res = await request(app).patch('/api/user/logo').set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(400)
  })

  it('401 — sin token', async () => {
    const res = await request(app).patch('/api/user/logo')
    expect(res.statusCode).toBe(401)
  })
})
