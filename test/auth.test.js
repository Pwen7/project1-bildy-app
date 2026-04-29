import { jest } from '@jest/globals'
import request from 'supertest'
import app from '../src/app.js'
import { connect, closeDatabase, clearDatabase } from './setup.js'

jest.mock('../src/services/mail.service.js', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true)
}))

jest.mock('../src/services/socket.service.js', () => ({
  initSocket: jest.fn(),
  getIO: jest.fn(() => ({ to: jest.fn(() => ({ emit: jest.fn() })), close: jest.fn() }))
}))

const USER = { email: 'auth@bildy.test', password: 'Password123' }

beforeAll(async () => { await connect() })
afterEach(async () => { await clearDatabase() })
afterAll(async () => { await closeDatabase() })

describe('POST /api/user/register', () => {
  it('201 — registra usuario y devuelve tokens', async () => {
    const res = await request(app).post('/api/user/register').send(USER)
    expect(res.statusCode).toBe(201)
    expect(res.body.error).toBe(false)
    expect(res.body.data.tokens).toHaveProperty('accessToken')
    expect(res.body.data.user.email).toBe(USER.email)
  })

  it('409 — email ya verificado', async () => {
    await request(app).post('/api/user/register').send(USER)
    const User = (await import('../src/models/User.js')).default
    await User.updateOne({ email: USER.email }, { status: 'verified' })
    const res = await request(app).post('/api/user/register').send(USER)
    expect(res.statusCode).toBe(409)
  })

  it('400 — email inválido', async () => {
    const res = await request(app).post('/api/user/register').send({ email: 'noesemail', password: 'Password123' })
    expect(res.statusCode).toBe(400)
  })

  it('400 — contraseña corta', async () => {
    const res = await request(app).post('/api/user/register').send({ email: 'a@b.com', password: '123' })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/user/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/user/register').send(USER)
    const User = (await import('../src/models/User.js')).default
    await User.updateOne({ email: USER.email }, { status: 'verified' })
  })

  it('200 — login correcto devuelve tokens', async () => {
    const res = await request(app).post('/api/user/login').send(USER)
    expect(res.statusCode).toBe(200)
    expect(res.body.data).toHaveProperty('accessToken')
  })

  it('401 — contraseña incorrecta', async () => {
    const res = await request(app).post('/api/user/login').send({ ...USER, password: 'wrongpass' })
    expect(res.statusCode).toBe(401)
  })

  it('401 — usuario inexistente', async () => {
    const res = await request(app).post('/api/user/login').send({ email: 'no@existe.com', password: 'Password123' })
    expect(res.statusCode).toBe(401)
  })
})

describe('GET /api/user', () => {
  it('401 — sin token', async () => {
    const res = await request(app).get('/api/user')
    expect(res.statusCode).toBe(401)
  })

  it('200 — con token válido', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    const res = await request(app).get('/api/user').set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.data.user.email).toBe(USER.email)
  })
})

describe('PUT /api/user/validation', () => {
  it('200 — código correcto verifica el email', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    const User = (await import('../src/models/User.js')).default
    const user = await User.findOne({ email: USER.email })
    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: user.verificationCode })
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toMatch(/verified/)
  })

  it('400 — código incorrecto', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' })
    expect(res.statusCode).toBe(400)
  })

  it('400 — email ya verificado', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    const User = (await import('../src/models/User.js')).default
    await User.updateOne({ email: USER.email }, { status: 'verified' })
    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '123456' })
    expect(res.statusCode).toBe(400)
  })

  it('429 — sin intentos restantes', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    const User = (await import('../src/models/User.js')).default
    await User.updateOne({ email: USER.email }, { verificationAttempts: 0 })
    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' })
    expect(res.statusCode).toBe(429)
  })
})

describe('PUT /api/user/register (personal data)', () => {
  it('200 — actualiza nombre, apellido y NIF', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    const res = await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ana', lastName: 'García', nif: '12345678A' })
    expect(res.statusCode).toBe(200)
    expect(res.body.data.user.name).toBe('Ana')
  })

  it('400 — faltan campos obligatorios', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    const res = await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Solo' })
    expect(res.statusCode).toBe(400)
  })
})

describe('PATCH /api/user/company — join existing', () => {
  it('200 — segundo usuario se une a empresa existente como guest', async () => {
    const CO = { name: 'Shared SL', cif: 'B11111111', address: { street: 'Calle Test', city: 'Madrid', province: 'Madrid' } }
    const r1 = await request(app).post('/api/user/register').send({ email: 'owner@bildy.test', password: 'Password123' })
    await request(app).patch('/api/user/company').set('Authorization', `Bearer ${r1.body.data.tokens.accessToken}`).send(CO)

    const r2 = await request(app).post('/api/user/register').send({ email: 'guest@bildy.test', password: 'Password123' })
    const res = await request(app).patch('/api/user/company').set('Authorization', `Bearer ${r2.body.data.tokens.accessToken}`).send(CO)
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toMatch(/Joined/)
  })
})

describe('POST /api/user/refresh', () => {
  it('200 — devuelve nuevo accessToken con refreshToken válido', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const refreshTk = reg.body.data.tokens.refreshToken
    const res = await request(app).post('/api/user/refresh').send({ refreshToken: refreshTk })
    expect(res.statusCode).toBe(200)
    expect(res.body.data).toHaveProperty('accessToken')
  })

  it('401 — refreshToken inválido', async () => {
    const res = await request(app).post('/api/user/refresh').send({ refreshToken: 'invalid-token-xyz' })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /api/user/logout', () => {
  it('200 — cierra sesión correctamente', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    const res = await request(app).post('/api/user/logout').set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toMatch(/Logged out/)
  })
})

describe('DELETE /api/user', () => {
  it('200 — soft delete desactiva la cuenta', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    const res = await request(app).delete('/api/user?soft=true').set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toMatch(/soft-deleted/)
  })

  it('200 — hard delete elimina la cuenta permanentemente', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    const res = await request(app).delete('/api/user').set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toMatch(/permanently deleted/)
  })
})

describe('PUT /api/user/password', () => {
  it('200 — cambia la contraseña con credenciales correctas', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: USER.password, newPassword: 'NewPassword456' })
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toMatch(/updated/)
  })

  it('401 — contraseña actual incorrecta', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPassword1', newPassword: 'NewPassword456' })
    expect(res.statusCode).toBe(401)
  })

  it('400 — nueva contraseña igual a la actual', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: USER.password, newPassword: USER.password })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/user/invite', () => {
  const INVITE_CO = { name: 'Invite SL', cif: 'B22222222', address: { street: 'Calle Test', city: 'Madrid', province: 'Madrid' } }

  it('201 — admin con empresa invita a nuevo usuario', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    await request(app).patch('/api/user/company').set('Authorization', `Bearer ${token}`).send(INVITE_CO)
    const res = await request(app).post('/api/user/invite').set('Authorization', `Bearer ${token}`)
      .send({ email: 'invited@bildy.test', name: 'Invitado', lastName: 'Test', password: 'Password123' })
    expect(res.statusCode).toBe(201)
    expect(res.body.data.user.role).toBe('guest')
  })

  it('409 — email ya registrado', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    await request(app).patch('/api/user/company').set('Authorization', `Bearer ${token}`).send(INVITE_CO)
    const invite = { email: 'dup@bildy.test', name: 'Dup', lastName: 'User', password: 'Password123' }
    await request(app).post('/api/user/invite').set('Authorization', `Bearer ${token}`).send(invite)
    const res = await request(app).post('/api/user/invite').set('Authorization', `Bearer ${token}`).send(invite)
    expect(res.statusCode).toBe(409)
  })

  it('403 — usuario guest no puede invitar', async () => {
    const CO2 = { name: 'Shared2 SL', cif: 'B33333333', address: { street: 'Calle Test', city: 'Madrid', province: 'Madrid' } }
    const r1 = await request(app).post('/api/user/register').send({ email: 'admin2@bildy.test', password: 'Password123' })
    await request(app).patch('/api/user/company').set('Authorization', `Bearer ${r1.body.data.tokens.accessToken}`).send(CO2)

    const r2 = await request(app).post('/api/user/register').send({ email: 'guest3@bildy.test', password: 'Password123' })
    const guestToken = r2.body.data.tokens.accessToken
    await request(app).patch('/api/user/company').set('Authorization', `Bearer ${guestToken}`).send(CO2)

    const res = await request(app).post('/api/user/invite').set('Authorization', `Bearer ${guestToken}`)
      .send({ email: 'another@bildy.test', name: 'X', lastName: 'Y', password: 'Password123' })
    expect(res.statusCode).toBe(403)
  })

  it('400 — admin sin empresa no puede invitar', async () => {
    const reg = await request(app).post('/api/user/register').send(USER)
    const token = reg.body.data.tokens.accessToken
    const res = await request(app).post('/api/user/invite').set('Authorization', `Bearer ${token}`)
      .send({ email: 'nocomp@bildy.test', name: 'No', lastName: 'Comp', password: 'Password123' })
    expect(res.statusCode).toBe(400)
  })
})
