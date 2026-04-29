import { jest } from '@jest/globals'
import { PassThrough } from 'stream'


const mockUploadStream = jest.fn()
jest.unstable_mockModule('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload_stream: mockUploadStream }
  }
}))

const mockSharpInstance = {
  resize: jest.fn().mockReturnThis(),
  webp: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-webp'))
}
const mockSharp = jest.fn(() => mockSharpInstance)
jest.unstable_mockModule('sharp', () => mockSharp)


const { uploadToCloud } = await import('../src/services/storage.service.js')

const MOCK_URL = 'https://res.cloudinary.com/bildy/image/upload/v1/test.webp'

// Helper: configures upload_stream to call its callback when stream finishes
const mockUpload = (error = null, result = { secure_url: MOCK_URL }) => {
  mockUploadStream.mockImplementationOnce((_opts, cb) => {
    const pass = new PassThrough()
    pass.on('finish', () => cb(error, result))
    return pass
  })
}

afterEach(() => jest.clearAllMocks())

describe('uploadToCloud — imagen', () => {
  it('procesa el buffer con sharp (resize → webp) antes de subir', async () => {
    mockUpload()
    const file = { buffer: Buffer.from('raw-jpeg'), mimetype: 'image/jpeg' }
    await uploadToCloud(file, { folder: 'logos' })
    expect(mockSharp).toHaveBeenCalledWith(file.buffer)
    expect(mockSharpInstance.resize).toHaveBeenCalledWith({ width: 800, withoutEnlargement: true })
    expect(mockSharpInstance.webp).toHaveBeenCalledWith({ quality: 85 })
    expect(mockSharpInstance.toBuffer).toHaveBeenCalled()
  })

  it('devuelve la URL segura de cloudinary', async () => {
    mockUpload()
    const file = { buffer: Buffer.from('raw-png'), mimetype: 'image/png' }
    const url = await uploadToCloud(file)
    expect(url).toBe(MOCK_URL)
  })

  it('pasa las opciones personalizadas a upload_stream', async () => {
    mockUpload()
    const file = { buffer: Buffer.from('img'), mimetype: 'image/jpeg' }
    await uploadToCloud(file, { folder: 'signatures', resource_type: 'image' })
    expect(mockUploadStream).toHaveBeenCalledWith(
      expect.objectContaining({ folder: 'signatures', resource_type: 'image' }),
      expect.any(Function)
    )
  })
})

describe('uploadToCloud — archivo no imagen (PDF)', () => {
  it('omite sharp y sube el buffer original directamente', async () => {
    mockUpload()
    const file = { buffer: Buffer.from('%PDF-1.4'), mimetype: 'application/pdf' }
    await uploadToCloud(file, { folder: 'delivery-notes', resource_type: 'raw' })
    expect(mockSharp).not.toHaveBeenCalled()
    expect(mockUploadStream).toHaveBeenCalledTimes(1)
  })

  it('devuelve la URL segura de cloudinary para el PDF', async () => {
    const pdfUrl = 'https://res.cloudinary.com/bildy/raw/upload/v1/doc.pdf'
    mockUpload(null, { secure_url: pdfUrl })
    const file = { buffer: Buffer.from('%PDF-1.4'), mimetype: 'application/pdf' }
    const url = await uploadToCloud(file)
    expect(url).toBe(pdfUrl)
  })
})

describe('uploadToCloud — errores', () => {
  it('rechaza la promesa cuando cloudinary devuelve un error', async () => {
    mockUpload(new Error('Cloudinary: invalid credentials'))
    const file = { buffer: Buffer.from('%PDF-1.4'), mimetype: 'application/pdf' }
    await expect(uploadToCloud(file)).rejects.toThrow('Cloudinary: invalid credentials')
  })

  it('rechaza cuando sharp lanza un error al procesar la imagen', async () => {
    const sharpError = new Error('Input buffer contains unsupported image format')
    mockSharp.mockImplementationOnce(() => ({
      resize: jest.fn().mockReturnThis(),
      webp: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockRejectedValue(sharpError)
    }))
    const file = { buffer: Buffer.from('not-an-image'), mimetype: 'image/jpeg' }
    await expect(uploadToCloud(file)).rejects.toThrow('Input buffer contains unsupported image format')
  })
})
