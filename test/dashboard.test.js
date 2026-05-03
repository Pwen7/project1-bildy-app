import { jest } from '@jest/globals'

jest.unstable_mockModule('../src/services/mail.service.js', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ messageId: 'test-mock' })
}))

jest.unstable_mockModule('../src/services/socket.service.js', () => ({
  initSocket: jest.fn(),
  getIO: jest.fn(() => ({ to: jest.fn(() => ({ emit: jest.fn() })), close: jest.fn() }))
}))

const request = (await import('supertest')).default
const { default: app } = await import('../src/app.js')
const { connect, closeDatabase, clearDatabase } = await import('./setup.js')

const USER = { email: 'dash@bildy.test', password: 'Password123' }
const COMPANY = { name: 'Dash SL', cif: 'B66666666', address: { street: 'St Test', city: 'Madrid', province: 'Madrid' } }

let token, clientId, projectId

const setup = async () => {
  const reg = await request(app).post('/api/user/register').send(USER)
  token = reg.body.data.tokens.accessToken
  await request(app).patch('/api/user/company').set('Authorization', `Bearer ${token}`).send(COMPANY)
  const cr = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send({ name: 'Cliente Dash', cif: 'A55555555' })
  clientId = cr.body.data.client._id
  const pr = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`)
    .send({ name: 'Proyecto Dash', projectCode: 'DSH-001', client: clientId })
  projectId = pr.body.data.project._id
  // Seed notes — 2 hours, 1 material, 1 in different month
  await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({
    project: projectId, client: clientId, format: 'hours', workDate: '2025-06-01', hours: 8
  })
  await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({
    project: projectId, client: clientId, format: 'hours', workDate: '2025-06-15', hours: 4
  })
  await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({
    project: projectId, client: clientId, format: 'material', workDate: '2025-07-10',
    material: 'Cemento', quantity: 50, unit: 'kg'
  })
}

beforeAll(async () => { await connect() })
afterEach(async () => { await clearDatabase() })
afterAll(async () => { await closeDatabase() })

describe('GET /api/dashboard', () => {
  it('200 — devuelve la forma esperada con datos agregados', async () => {
    await setup()
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.error).toBe(false)
    expect(res.body.data).toHaveProperty('notesPerMonth')
    expect(res.body.data).toHaveProperty('hoursPerProject')
    expect(res.body.data).toHaveProperty('materialsPerClient')
    expect(res.body.data).toHaveProperty('counters')

    // 2 months of data: 2025-06 (2 notes), 2025-07 (1 note)
    const months = res.body.data.notesPerMonth
    expect(months).toEqual(expect.arrayContaining([
      expect.objectContaining({ month: '2025-06', count: 2 }),
      expect.objectContaining({ month: '2025-07', count: 1 })
    ]))

    // Hours per project: project has 8 + 4 = 12 hours
    const hours = res.body.data.hoursPerProject
    expect(hours).toHaveLength(1)
    expect(hours[0]).toMatchObject({ hours: 12, projectName: 'Proyecto Dash', projectCode: 'DSH-001' })

    // Materials per client: 1 entry, 50 kg
    const materials = res.body.data.materialsPerClient
    expect(materials).toHaveLength(1)
    expect(materials[0]).toMatchObject({ clientName: 'Cliente Dash', quantities: [50], units: ['kg'] })

    // Counters: 0 signed, 3 unsigned, 1 active project, 0 archived
    expect(res.body.data.counters).toMatchObject({
      signed: 0,
      unsigned: 3,
      activeProjects: 1,
      archivedProjects: 0
    })
  })

  it('401 — sin token', async () => {
    const res = await request(app).get('/api/dashboard')
    expect(res.statusCode).toBe(401)
  })
})
