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

jest.mock('../src/services/storage.service.js', () => ({
  uploadToCloud: jest.fn().mockResolvedValue('https://cloud.example.com/test.webp')
}))

jest.mock('../src/services/pdf.service.js', () => ({
  generateDeliveryNotePDF: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 test'))
}))

const USER = { email: 'dn@bildy.test', password: 'Password123' }
const COMPANY = { name: 'DN SL', cif: 'B77777777', address: { street: 'St Test', city: 'Madrid', province: 'Madrid' } }

let token, clientId, projectId

const setup = async () => {
  const reg = await request(app).post('/api/user/register').send(USER)
  token = reg.body.data.tokens.accessToken
  await request(app).patch('/api/user/company').set('Authorization', `Bearer ${token}`).send(COMPANY)
  const cr = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send({ name: 'Cliente DN', cif: 'A33333333' })
  clientId = cr.body.data.client._id
  const pr = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`)
    .send({ name: 'Proyecto DN', projectCode: 'DN-001', client: clientId })
  projectId = pr.body.data.project._id
}

beforeAll(async () => { await connect() })
afterEach(async () => { await clearDatabase() })
afterAll(async () => { await closeDatabase() })

describe('POST /api/deliverynote', () => {
  beforeEach(setup)

  it('201 — crea albarán de materiales', async () => {
    const res = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({
      project: projectId, client: clientId,
      format: 'material', workDate: '2025-06-01',
      material: 'Cemento', quantity: 100, unit: 'kg'
    })
    expect(res.statusCode).toBe(201)
    expect(res.body.data.note.format).toBe('material')
  })

  it('201 — crea albarán de horas', async () => {
    const res = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({
      project: projectId, client: clientId,
      format: 'hours', workDate: '2025-06-01', hours: 8
    })
    expect(res.statusCode).toBe(201)
    expect(res.body.data.note.hours).toBe(8)
  })

  it('400 — format hours sin hours ni workers', async () => {
    const res = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({
      project: projectId, client: clientId,
      format: 'hours', workDate: '2025-06-01'
    })
    expect(res.statusCode).toBe(400)
  })

  it('404 — proyecto inexistente', async () => {
    const res = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({
      project: '000000000000000000000000', client: clientId,
      format: 'hours', workDate: '2025-06-01', hours: 4
    })
    expect(res.statusCode).toBe(404)
  })

  it('404 — cliente inexistente', async () => {
    const res = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({
      project: projectId, client: '000000000000000000000000',
      format: 'hours', workDate: '2025-06-01', hours: 4
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('GET /api/deliverynote', () => {
  beforeEach(async () => {
    await setup()
    await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({
      project: projectId, client: clientId,
      format: 'hours', workDate: '2025-06-01', hours: 8
    })
  })

  it('200 — lista albaranes', async () => {
    const res = await request(app).get('/api/deliverynote').set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.data.notes).toHaveLength(1)
  })

  it('200 — filtra por format', async () => {
    const res = await request(app).get('/api/deliverynote?format=hours').set('Authorization', `Bearer ${token}`)
    expect(res.body.data.notes).toHaveLength(1)
  })

  it('200 — filtra por signed=false', async () => {
    const res = await request(app).get('/api/deliverynote?signed=false').set('Authorization', `Bearer ${token}`)
    expect(res.body.data.notes).toHaveLength(1)
  })
})

describe('GET /api/deliverynote/pdf/:id', () => {
  let noteId

  beforeEach(async () => {
    await setup()
    const res = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({
      project: projectId, client: clientId,
      format: 'material', workDate: '2025-06-01',
      material: 'Pintura', quantity: 10, unit: 'L'
    })
    noteId = res.body.data.note._id
  })

  it('200 — devuelve buffer PDF', async () => {
    const res = await request(app).get(`/api/deliverynote/pdf/${noteId}`).set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/pdf/)
  })
})

describe('GET /api/deliverynote/:id', () => {
  let noteId

  beforeEach(async () => {
    await setup()
    const res = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({
      project: projectId, client: clientId,
      format: 'hours', workDate: '2025-06-01', hours: 6
    })
    noteId = res.body.data.note._id
  })

  it('200 — obtiene albarán por ID', async () => {
    const res = await request(app).get(`/api/deliverynote/${noteId}`).set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.data.note._id).toBe(noteId)
  })

  it('404 — ID inexistente', async () => {
    const res = await request(app).get('/api/deliverynote/000000000000000000000000').set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(404)
  })
})

describe('PATCH /api/deliverynote/:id/sign', () => {
  let noteId

  beforeEach(async () => {
    await setup()
    const res = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({
      project: projectId, client: clientId,
      format: 'hours', workDate: '2025-06-01', hours: 4
    })
    noteId = res.body.data.note._id
  })

  it('200 — firma el albarán con imagen de firma', async () => {
    const res = await request(app)
      .patch(`/api/deliverynote/${noteId}/sign`)
      .set('Authorization', `Bearer ${token}`)
      .attach('signature', Buffer.from('fake-signature-data'), { filename: 'firma.jpg', contentType: 'image/jpeg' })
    expect(res.statusCode).toBe(200)
    expect(res.body.data.note.signed).toBe(true)
  })

  it('400 — firma sin adjuntar imagen', async () => {
    const res = await request(app)
      .patch(`/api/deliverynote/${noteId}/sign`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(400)
  })

  it('400 — albarán ya firmado no puede firmarse de nuevo', async () => {
    const DeliveryNote = (await import('../src/models/DeliveryNote.js')).default
    await DeliveryNote.findByIdAndUpdate(noteId, { signed: true })
    const res = await request(app)
      .patch(`/api/deliverynote/${noteId}/sign`)
      .set('Authorization', `Bearer ${token}`)
      .attach('signature', Buffer.from('fake-signature-data'), { filename: 'firma.jpg', contentType: 'image/jpeg' })
    expect(res.statusCode).toBe(400)
  })
})

describe('DELETE /api/deliverynote/:id', () => {
  let noteId

  beforeEach(async () => {
    await setup()
    const res = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({
      project: projectId, client: clientId,
      format: 'hours', workDate: '2025-06-01', hours: 4
    })
    noteId = res.body.data.note._id
  })

  it('200 — elimina albarán sin firmar', async () => {
    const res = await request(app).delete(`/api/deliverynote/${noteId}`).set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
  })

  it('400 — no puede eliminar albarán firmado', async () => {
    const DeliveryNote = (await import('../src/models/DeliveryNote.js')).default
    await DeliveryNote.findByIdAndUpdate(noteId, { signed: true })
    const res = await request(app).delete(`/api/deliverynote/${noteId}`).set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(400)
  })
})
