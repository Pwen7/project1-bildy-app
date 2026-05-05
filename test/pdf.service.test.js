import { generateDeliveryNotePDF } from '../src/services/pdf.service.js'

const NOTE_FIXTURE = {
  _id: '65f8b3a2c9d1e20012345678',
  format: 'hours',
  description: 'Trabajos eléctricos en planta baja',
  workDate: new Date('2025-06-15'),
  hours: 8,
  workers: [
    { name: 'Juan García', hours: 4 },
    { name: 'Ana Pérez', hours: 4 }
  ],
  signed: false,
  user: { name: 'Carlos', lastName: 'Ruiz', email: 'carlos@test.com', nif: '12345678A' },
  client: { name: 'Cliente SA', cif: 'B11111111', email: 'cliente@test.com' },
  project: { name: 'Reforma Oficina', projectCode: 'PRJ-001' },
  company: { name: 'Bildy SL' }
}

describe('pdf.service — generateDeliveryNotePDF', () => {
  it('returns a Buffer that starts with the PDF magic header', async () => {
    const buffer = await generateDeliveryNotePDF(NOTE_FIXTURE)
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.length).toBeGreaterThan(0)
    // PDF files always start with the literal "%PDF-" magic number
    expect(buffer.slice(0, 5).toString()).toBe('%PDF-')
  })

  it('renders a material-format note without throwing', async () => {
    const materialNote = {
      ...NOTE_FIXTURE,
      format: 'material',
      material: 'Cemento Portland',
      quantity: 50,
      unit: 'kg',
      hours: undefined,
      workers: undefined
    }
    const buffer = await generateDeliveryNotePDF(materialNote)
    expect(buffer.slice(0, 5).toString()).toBe('%PDF-')
  })

  it('renders a signed note (uses signedAt branch) without throwing', async () => {
    const signedNote = { ...NOTE_FIXTURE, signed: true, signedAt: new Date('2025-06-16T10:00:00Z') }
    const buffer = await generateDeliveryNotePDF(signedNote)
    expect(buffer.slice(0, 5).toString()).toBe('%PDF-')
  })
})
