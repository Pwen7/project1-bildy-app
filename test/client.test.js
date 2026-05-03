import { jest } from '@jest/globals'
import request from 'supertest'
import app from '../src/app.js'
import { connect, closeDatabase, clearDatabase } from './setup.js'

jest.mock('../src/services/mail.service.js', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ messageId: 'test-mock' })
}))

jest.mock('../src/services/socket.service.js', () => ({
  initSocket: jest.fn(),
  getIO: jest.fn(() => ({ to: jest.fn(() => ({ emit: jest.fn() })), close: jest.fn() }))
}))

const USER = { email: 'client@bildy.test', password: 'Password123' }
const COMPANY = { name: 'Test SL', cif: 'B99999999', address: { street: 'Calle Test', city: 'Madrid', province: 'Madrid' } }
const CLIENT = { name: 'Cliente Test SA', cif: 'A11111111', email: 'cliente@test.com' }

let token

const setup = async () => {
  const reg = await request(app).post('/api/user/register').send(USER)
  token = reg.body.data.tokens.accessToken
  await request(app).patch('/api/user/company').set('Authorization', `Bearer ${token}`).send(COMPANY)
}

beforeAll(async () => { await connect() })
afterEach(async () => { await clearDatabase() })
afterAll(async () => { await closeDatabase() })

describe('POST /api/client', () => {
  beforeEach(setup)

  it('201 — crea cliente', async () => {
    const res = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(CLIENT)
    expect(res.statusCode).toBe(201)
    expect(res.body.data.client.name).toBe(CLIENT.name)
  })

  it('409 — CIF duplicado', async () => {
    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(CLIENT)
    const res = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(CLIENT)
    expect(res.statusCode).toBe(409)
  })

  it('400 — sin name', async () => {
    const res = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send({ cif: 'B00000001' })
    expect(res.statusCode).toBe(400)
  })

  it('401 — sin token', async () => {
    const res = await request(app).post('/api/client').send(CLIENT)
    expect(res.statusCode).toBe(401)
  })
})

describe('GET /api/client', () => {
  beforeEach(async () => {
    await setup()
    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(CLIENT)
  })

  it('200 — lista con paginación', async () => {
    const res = await request(app).get('/api/client').set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.data.clients).toHaveLength(1)
    expect(res.body.data.pagination).toHaveProperty('totalItems', 1)
  })

  it('200 — filtro por name', async () => {
    const res = await request(app).get('/api/client?name=Cliente').set('Authorization', `Bearer ${token}`)
    expect(res.body.data.clients.length).toBeGreaterThan(0)
  })

  it('200 — filtro sin coincidencias', async () => {
    const res = await request(app).get('/api/client?name=XYZ').set('Authorization', `Bearer ${token}`)
    expect(res.body.data.clients).toHaveLength(0)
  })
})

describe('GET /api/client — paginación multi-página', () => {
  beforeEach(async () => {
    await setup()
    // Seed 12 clients so page 1 (limit 10) is full and page 2 has 2 items
    for (let i = 0; i < 12; i++) {
      await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Cliente ${i.toString().padStart(2, '0')}`, cif: `B0000000${i.toString().padStart(2, '0')}` })
    }
  })

  it('200 — ?page=2&limit=10 devuelve la segunda página correctamente', async () => {
    const p1 = await request(app).get('/api/client?page=1&limit=10&sort=createdAt').set('Authorization', `Bearer ${token}`)
    const p2 = await request(app).get('/api/client?page=2&limit=10&sort=createdAt').set('Authorization', `Bearer ${token}`)
    expect(p1.statusCode).toBe(200)
    expect(p2.statusCode).toBe(200)
    expect(p1.body.data.clients).toHaveLength(10)
    expect(p2.body.data.clients).toHaveLength(2)
    expect(p2.body.data.pagination).toMatchObject({ totalItems: 12, totalPages: 2, currentPage: 2 })
    const ids1 = p1.body.data.clients.map(c => c._id)
    const ids2 = p2.body.data.clients.map(c => c._id)
    expect(ids1.some(id => ids2.includes(id))).toBe(false)
  })
})

describe('Client — 401 sin token', () => {
  it('GET /api/client → 401', async () => {
    const res = await request(app).get('/api/client')
    expect(res.statusCode).toBe(401)
  })
  it('GET /api/client/archived → 401', async () => {
    const res = await request(app).get('/api/client/archived')
    expect(res.statusCode).toBe(401)
  })
  it('GET /api/client/:id → 401', async () => {
    const res = await request(app).get('/api/client/000000000000000000000000')
    expect(res.statusCode).toBe(401)
  })
  it('PUT /api/client/:id → 401', async () => {
    const res = await request(app).put('/api/client/000000000000000000000000').send({ name: 'X' })
    expect(res.statusCode).toBe(401)
  })
  it('DELETE /api/client/:id → 401', async () => {
    const res = await request(app).delete('/api/client/000000000000000000000000')
    expect(res.statusCode).toBe(401)
  })
  it('PATCH /api/client/:id/restore → 401', async () => {
    const res = await request(app).patch('/api/client/000000000000000000000000/restore')
    expect(res.statusCode).toBe(401)
  })
})

describe('GET /api/client/:id', () => {
  let clientId

  beforeEach(async () => {
    await setup()
    const res = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(CLIENT)
    clientId = res.body.data.client._id
  })

  it('200 — obtiene cliente por ID', async () => {
    const res = await request(app).get(`/api/client/${clientId}`).set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.data.client._id).toBe(clientId)
  })

  it('404 — ID inexistente', async () => {
    const res = await request(app).get('/api/client/000000000000000000000000').set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /api/client/:id', () => {
  let clientId

  beforeEach(async () => {
    await setup()
    const res = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(CLIENT)
    clientId = res.body.data.client._id
  })

  it('200 — soft delete archiva el cliente', async () => {
    await request(app).delete(`/api/client/${clientId}?soft=true`).set('Authorization', `Bearer ${token}`)
    const archived = await request(app).get('/api/client/archived').set('Authorization', `Bearer ${token}`)
    expect(archived.body.data.clients).toHaveLength(1)
  })

  it('200 — hard delete elimina permanentemente', async () => {
    await request(app).delete(`/api/client/${clientId}`).set('Authorization', `Bearer ${token}`)
    const list = await request(app).get('/api/client').set('Authorization', `Bearer ${token}`)
    expect(list.body.data.clients).toHaveLength(0)
  })
})

describe('PATCH /api/client/:id/restore', () => {
  let clientId

  beforeEach(async () => {
    await setup()
    const res = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(CLIENT)
    clientId = res.body.data.client._id
    await request(app).delete(`/api/client/${clientId}?soft=true`).set('Authorization', `Bearer ${token}`)
  })

  it('200 — restaura cliente archivado', async () => {
    const res = await request(app).patch(`/api/client/${clientId}/restore`).set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    const list = await request(app).get('/api/client').set('Authorization', `Bearer ${token}`)
    expect(list.body.data.clients).toHaveLength(1)
  })
})

describe('PUT /api/client/:id', () => {
  let clientId

  beforeEach(async () => {
    await setup()
    const res = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(CLIENT)
    clientId = res.body.data.client._id
  })

  it('200 — actualiza el nombre del cliente', async () => {
    const res = await request(app)
      .put(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cliente Actualizado SA' })
    expect(res.statusCode).toBe(200)
    expect(res.body.data.client.name).toBe('Cliente Actualizado SA')
  })

  it('409 — CIF duplicado al actualizar', async () => {
    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Segundo SA', cif: 'B11111112' })
    const res = await request(app)
      .put(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ cif: 'B11111112' })
    expect(res.statusCode).toBe(409)
  })

  it('404 — cliente inexistente', async () => {
    const res = await request(app)
      .put('/api/client/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No existe' })
    expect(res.statusCode).toBe(404)
  })
})
