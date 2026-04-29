import { jest } from '@jest/globals'


const mockUse = jest.fn()
const mockOn = jest.fn()
const mockIOInstance = { use: mockUse, on: mockOn }

jest.unstable_mockModule('socket.io', () => ({
  Server: jest.fn(() => mockIOInstance)
}))

const mockVerifyAccessToken = jest.fn()
jest.unstable_mockModule('../src/utils/jwt.util.js', () => ({
  verifyAccessToken: mockVerifyAccessToken,
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn()
}))

const mockFindById = jest.fn()
jest.unstable_mockModule('../src/models/User.js', () => ({
  default: { findById: mockFindById }
}))

const { Server } = await import('socket.io')
const { initSocket, getIO } = await import('../src/services/socket.service.js')

afterEach(() => jest.clearAllMocks())

describe('getIO', () => {
  it('throws when initSocket has not been called yet', () => {
    expect(() => getIO()).toThrow('Socket.IO not initialised')
  })
})


describe('initSocket', () => {
  beforeEach(() => { initSocket({}) })

  it('crea un Server de socket.io', () => {
    expect(Server).toHaveBeenCalled()
  })

  it('registra el middleware de autenticación con io.use()', () => {
    expect(mockUse).toHaveBeenCalledTimes(1)
    expect(mockUse).toHaveBeenCalledWith(expect.any(Function))
  })

  it('registra el handler de conexión con io.on("connection")', () => {
    expect(mockOn).toHaveBeenCalledWith('connection', expect.any(Function))
  })

  it('getIO devuelve la instancia activa tras init', () => {
    expect(getIO()).toBe(mockIOInstance)
  })
})


describe('socket auth middleware', () => {
  const MOCK_USER = { _id: 'uid1', email: 'u@test.com', deleted: false, company: 'comp1' }
  let middleware

  beforeEach(() => {
    initSocket({})
    middleware = mockUse.mock.calls[0][0]
  })

  it('llama a next con error cuando no hay token', async () => {
    const socket = { handshake: { auth: {}, headers: {} } }
    const next = jest.fn()
    await middleware(socket, next)
    expect(next).toHaveBeenCalledWith(expect.stringContaining('Authentication required'))
  })

  it('llama a next con error cuando el token JWT es inválido', async () => {
    mockVerifyAccessToken.mockImplementationOnce(() => { throw new Error('jwt malformed') })
    const socket = { handshake: { auth: { token: 'bad.token' }, headers: {} } }
    const next = jest.fn()
    await middleware(socket, next)
    expect(next).toHaveBeenCalledWith(expect.stringContaining('jwt malformed'))
  })

  it('llama a next con error cuando el usuario no existe en BD', async () => {
    mockVerifyAccessToken.mockReturnValueOnce({ _id: 'uid1' })
    mockFindById.mockReturnValueOnce({ select: jest.fn().mockResolvedValue(null) })
    const socket = { handshake: { auth: { token: 'valid.token' }, headers: {} } }
    const next = jest.fn()
    await middleware(socket, next)
    expect(next).toHaveBeenCalledWith(expect.stringContaining('User not found'))
  })

  it('llama a next con error cuando el usuario está eliminado', async () => {
    mockVerifyAccessToken.mockReturnValueOnce({ _id: 'uid1' })
    mockFindById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({ ...MOCK_USER, deleted: true })
    })
    const socket = { handshake: { auth: { token: 'valid.token' }, headers: {} } }
    const next = jest.fn()
    await middleware(socket, next)
    expect(next).toHaveBeenCalledWith(expect.stringContaining('User not found'))
  })

  it('asigna socket.user y llama a next() sin args con token válido', async () => {
    mockVerifyAccessToken.mockReturnValueOnce({ _id: 'uid1' })
    mockFindById.mockReturnValueOnce({ select: jest.fn().mockResolvedValue(MOCK_USER) })
    const socket = { handshake: { auth: { token: 'valid.token' }, headers: {} } }
    const next = jest.fn()
    await middleware(socket, next)
    expect(socket.user).toBe(MOCK_USER)
    expect(next).toHaveBeenCalledWith()
  })

  it('acepta el token desde el header Authorization', async () => {
    mockVerifyAccessToken.mockReturnValueOnce({ _id: 'uid1' })
    mockFindById.mockReturnValueOnce({ select: jest.fn().mockResolvedValue(MOCK_USER) })
    const socket = {
      handshake: { auth: {}, headers: { authorization: 'Bearer header.token' } }
    }
    const next = jest.fn()
    await middleware(socket, next)
    expect(mockVerifyAccessToken).toHaveBeenCalledWith('header.token')
    expect(next).toHaveBeenCalledWith()
  })
})

describe('socket connection handler', () => {
  let connectionHandler

  beforeEach(() => {
    initSocket({})
    connectionHandler = mockOn.mock.calls.find(([ev]) => ev === 'connection')[1]
  })

  it('el usuario se une a la sala de su empresa', () => {
    const socket = {
      user: { email: 'u@test.com', company: { toString: () => 'comp-123' } },
      join: jest.fn(),
      on: jest.fn()
    }
    connectionHandler(socket)
    expect(socket.join).toHaveBeenCalledWith('comp-123')
  })

  it('registra el handler de disconnect en el socket', () => {
    const socket = {
      user: { email: 'u@test.com', company: { toString: () => 'comp-123' } },
      join: jest.fn(),
      on: jest.fn()
    }
    connectionHandler(socket)
    expect(socket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
  })
})
