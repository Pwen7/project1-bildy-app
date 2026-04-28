import PDFDocument from 'pdfkit'

export const generateDeliveryNotePDF = (note) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const primary = '#1a1a2e'
    const accent = '#4f46e5'
    const gray = '#6b7280'

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill(primary)
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
      .text('ALBARÁN', 50, 28)
    doc.fontSize(10).font('Helvetica')
      .text(`Nº ${note._id}`, 50, 55)
    doc.fontSize(12).font('Helvetica-Bold')
      .text(note.company?.name || '', 0, 35, { align: 'right', width: doc.page.width - 50 })

    doc.fillColor(primary)

    // ── Info boxes
    const boxY = 110
    const boxH = 90

    doc.rect(50, boxY, 230, boxH).stroke(accent)
    doc.fontSize(9).font('Helvetica-Bold').fillColor(accent).text('TRABAJADOR', 60, boxY + 8)
    doc.fontSize(10).font('Helvetica').fillColor(primary)
      .text(note.user?.fullName || `${note.user?.name || ''} ${note.user?.lastName || ''}`.trim(), 60, boxY + 22)
      .text(note.user?.email || '', 60, boxY + 36)
      .text(note.user?.nif || '', 60, boxY + 50)

    doc.rect(300, boxY, 245, boxH).stroke(accent)
    doc.fontSize(9).font('Helvetica-Bold').fillColor(accent).text('CLIENTE', 310, boxY + 8)
    doc.fontSize(10).font('Helvetica').fillColor(primary)
      .text(note.client?.name || '', 310, boxY + 22)
      .text(note.client?.cif || '', 310, boxY + 36)
      .text(note.client?.email || '', 310, boxY + 50)

    doc.rect(50, boxY + boxH + 10, 495, 60).stroke(accent)
    doc.fontSize(9).font('Helvetica-Bold').fillColor(accent).text('PROYECTO', 60, boxY + boxH + 18)
    doc.fontSize(10).font('Helvetica').fillColor(primary)
      .text(`${note.project?.name || ''}  ·  Código: ${note.project?.projectCode || ''}`, 60, boxY + boxH + 32)
    if (note.description) doc.text(note.description, 60, boxY + boxH + 46)

    doc.y = boxY + boxH + 90

    // Work date & format
    const workDate = note.workDate ? new Date(note.workDate).toLocaleDateString('es-ES') : '-'
    doc.fontSize(10).fillColor(gray)
      .text('Fecha de trabajo: ', 50, doc.y, { continued: true })
      .fillColor(primary).font('Helvetica-Bold').text(workDate)
      .font('Helvetica').fillColor(gray)
      .text('Tipo: ', 50, doc.y, { continued: true })
      .fillColor(primary).font('Helvetica-Bold')
      .text(note.format === 'hours' ? 'Horas' : 'Material')

    doc.moveDown()

    // Detail table
    doc.font('Helvetica-Bold').fontSize(11).fillColor(accent)
      .text(note.format === 'hours' ? 'Detalle de horas' : 'Detalle de materiales', 50, doc.y)
    doc.moveDown(0.4)

    const tableTop = doc.y
    doc.rect(50, tableTop, 495, 20).fill('#f3f4f6')
    doc.fillColor(primary).fontSize(9).font('Helvetica-Bold')

    if (note.format === 'hours') {
      doc.text('Trabajador', 60, tableTop + 5)
      doc.text('Horas', 420, tableTop + 5)

      let rowY = tableTop + 22
      doc.font('Helvetica').fontSize(10)

      if (note.workers?.length > 0) {
        note.workers.forEach((w, i) => {
          if (i % 2 === 0) doc.rect(50, rowY - 2, 495, 18).fill('#f9fafb')
          doc.fillColor(primary).text(w.name, 60, rowY).text(`${w.hours} h`, 420, rowY)
          rowY += 20
        })
      } else if (note.hours !== undefined) {
        doc.fillColor(primary).text('Total', 60, rowY).text(`${note.hours} h`, 420, rowY)
        rowY += 20
      }

      doc.y = rowY + 10
    } else {
      doc.text('Material', 60, tableTop + 5)
      doc.text('Cantidad', 300, tableTop + 5)
      doc.text('Unidad', 420, tableTop + 5)

      const rowY = tableTop + 22
      doc.rect(50, rowY - 2, 495, 18).fill('#f9fafb')
      doc.fillColor(primary).font('Helvetica').fontSize(10)
        .text(note.material || '', 60, rowY)
        .text(String(note.quantity ?? ''), 300, rowY)
        .text(note.unit || '', 420, rowY)

      doc.y = rowY + 30
    }

    // Signature
    if (note.signed) {
      doc.moveDown()
      doc.fontSize(9).fillColor(gray)
        .text(`Firmado el ${new Date(note.signedAt).toLocaleString('es-ES')}`, 50, doc.y)
    } else {
      doc.moveDown(2)
      doc.rect(300, doc.y, 245, 60).stroke(gray)
      doc.fontSize(9).fillColor(gray).text('Firma del cliente', 310, doc.y + 45)
    }

    // Footer
    doc.fontSize(8).fillColor(gray)
      .text(
        `Generado por BildyApp · ${new Date().toLocaleString('es-ES')}`,
        50, doc.page.height - 40,
        { align: 'center', width: doc.page.width - 100 }
      )

    doc.end()
  })
}
