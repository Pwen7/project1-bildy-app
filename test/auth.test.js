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
})
