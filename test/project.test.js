import { jest } from '@jest/globals'
import request from 'supertest'
import app from '../src/app.js'
import { clearDatabase, closeDatabase, connect } from './setup.js'

jest.mock('../src/services/mail.service.js', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ messageId: 'test-mock' })
}))

jest.mock('../src/services/socket.service.js', () => ({
  initSocket: jest.fn(),
  getIO: jest.fn(() => ({ to: jest.fn(() => ({ emit: jest.fn() })), close: jest.fn() }))
}))

const USER = { email: 'project@bildy.test', password: 'Password123' }
const COMPANY = { name: 'Project SL', cif: 'B88888888', address: { street: 'Calle Test', city: 'Madrid', province: 'Madrid' } }

let token, clientId

const setup = async () => {
  const reg = await request(app).post('/api/user/register').send(USER)
  token = reg.body.data.tokens.accessToken
  await request(app).patch('/api/user/company').set('Authorization', `Bearer ${token}`).send(COMPANY)
  const cr = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send({ name: 'Cliente Proyecto', cif: 'A22222222' })
  clientId = cr.body.data.client._id
}

beforeAll(async () => { await connect() })
afterEach(async () => { await clearDatabase() })
afterAll(async () => { await closeDatabase() })

describe('POST /api/project', () => {
  beforeEach(setup)

  it('201 — crea proyecto', async () => {
    const res = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Reforma Oficina', projectCode: 'PRJ-001', client: clientId })
    expect(res.statusCode).toBe(201)
    expect(res.body.data.project.name).toBe('Reforma Oficina')
  })

  it('409 — código de proyecto duplicado', async () => {
    const payload = { name: 'P1', projectCode: 'PRJ-DUP', client: clientId }
    await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send(payload)
    const res = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send(payload)
    expect(res.statusCode).toBe(409)
  })

  it('404 — cliente inexistente', async () => {
    const res = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`)
      .send({ name: 'P', projectCode: 'PRJ-X', client: '000000000000000000000000' })
    expect(res.statusCode).toBe(404)
  })

  it('400 — faltan campos obligatorios', async () => {
    const res = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ name: 'P' })
    expect(res.statusCode).toBe(400)
  })
})

describe('GET /api/project', () => {
  beforeEach(async () => {
    await setup()
    await request(app).post('/api/project').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto A', projectCode: 'PRJ-A', client: clientId })
    await request(app).post('/api/project').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto B', projectCode: 'PRJ-B', client: clientId, active: false })
  })

  it('200 — lista todos los proyectos', async () => {
    const res = await request(app).get('/api/project').set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.data.projects).toHaveLength(2)
  })

  it('200 — filtra por active=false', async () => {
    const res = await request(app).get('/api/project?active=false').set('Authorization', `Bearer ${token}`)
    expect(res.body.data.projects).toHaveLength(1)
  })

  it('200 — filtra por client', async () => {
    const res = await request(app).get(`/api/project?client=${clientId}`).set('Authorization', `Bearer ${token}`)
    expect(res.body.data.projects.length).toBeGreaterThan(0)
  })
})

describe('DELETE + restore /api/project', () => {
  let projectId

  beforeEach(async () => {
    await setup()
    const res = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Borrable', projectCode: 'PRJ-DEL', client: clientId })
    projectId = res.body.data.project._id
  })

  it('200 — soft delete archiva el proyecto', async () => {
    await request(app).delete(`/api/project/${projectId}?soft=true`).set('Authorization', `Bearer ${token}`)
    const res = await request(app).get('/api/project/archived').set('Authorization', `Bearer ${token}`)
    expect(res.body.data.projects).toHaveLength(1)
  })

  it('200 — hard delete elimina el proyecto permanentemente', async () => {
    await request(app).delete(`/api/project/${projectId}`).set('Authorization', `Bearer ${token}`)
    const res = await request(app).get('/api/project').set('Authorization', `Bearer ${token}`)
    expect(res.body.data.projects).toHaveLength(0)
  })

  it('200 — restaura proyecto archivado', async () => {
    await request(app).delete(`/api/project/${projectId}?soft=true`).set('Authorization', `Bearer ${token}`)
    const res = await request(app).patch(`/api/project/${projectId}/restore`).set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
  })
})

describe('GET /api/project/:id', () => {
  let projectId

  beforeEach(async () => {
    await setup()
    const res = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto X', projectCode: 'PRJ-X1', client: clientId })
    projectId = res.body.data.project._id
  })

  it('200 — obtiene proyecto por ID', async () => {
    const res = await request(app).get(`/api/project/${projectId}`).set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.data.project._id).toBe(projectId)
  })

  it('404 — ID inexistente', async () => {
    const res = await request(app).get('/api/project/000000000000000000000000').set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(404)
  })
})

describe('PUT /api/project/:id', () => {
  let projectId

  beforeEach(async () => {
    await setup()
    const res = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Editable', projectCode: 'PRJ-EDIT', client: clientId })
    projectId = res.body.data.project._id
  })

  it('200 — actualiza el nombre del proyecto', async () => {
    const res = await request(app)
      .put(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nombre Actualizado' })
    expect(res.statusCode).toBe(200)
    expect(res.body.data.project.name).toBe('Nombre Actualizado')
  })

  it('409 — código de proyecto duplicado al actualizar', async () => {
    await request(app).post('/api/project').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Otro', projectCode: 'PRJ-OTHER', client: clientId })
    const res = await request(app)
      .put(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ projectCode: 'PRJ-OTHER' })
    expect(res.statusCode).toBe(409)
  })

  it('404 — proyecto inexistente', async () => {
    const res = await request(app)
      .put('/api/project/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No existe' })
    expect(res.statusCode).toBe(404)
  })
})

describe('Project — 401 sin token', () => {
  it('POST /api/project → 401', async () => {
    const res = await request(app).post('/api/project').send({ name: 'x', projectCode: 'p', client: '000000000000000000000000' })
    expect(res.statusCode).toBe(401)
  })
  it('GET /api/project → 401', async () => {
    const res = await request(app).get('/api/project')
    expect(res.statusCode).toBe(401)
  })
  it('GET /api/project/archived → 401', async () => {
    const res = await request(app).get('/api/project/archived')
    expect(res.statusCode).toBe(401)
  })
  it('GET /api/project/:id → 401', async () => {
    const res = await request(app).get('/api/project/000000000000000000000000')
    expect(res.statusCode).toBe(401)
  })
  it('PUT /api/project/:id → 401', async () => {
    const res = await request(app).put('/api/project/000000000000000000000000').send({ name: 'X' })
    expect(res.statusCode).toBe(401)
  })
  it('DELETE /api/project/:id → 401', async () => {
    const res = await request(app).delete('/api/project/000000000000000000000000')
    expect(res.statusCode).toBe(401)
  })
  it('PATCH /api/project/:id/restore → 401', async () => {
    const res = await request(app).patch('/api/project/000000000000000000000000/restore')
    expect(res.statusCode).toBe(401)
  })
})
