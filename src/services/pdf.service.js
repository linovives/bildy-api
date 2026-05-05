import PDFDocument from 'pdfkit';

const fetchImageBuffer = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
};

export const generateDeliveryNotePdf = async (note) => {
  const doc = new PDFDocument({ margin: 50 });
  const buffers = [];

  doc.on('data', chunk => buffers.push(chunk));

  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });

  // Cabecera
  doc.fontSize(20).font('Helvetica-Bold').text('ALBARÁN', { align: 'center' });
  doc.moveDown();

  // Usuario
  if (note.user) {
    doc.fontSize(12).font('Helvetica-Bold').text('Creado por');
    doc.font('Helvetica');
    if (note.user.name) doc.text(`Nombre: ${note.user.name}`);
    if (note.user.email) doc.text(`Email: ${note.user.email}`);
    doc.moveDown();
  }

  // Datos del albarán
  doc.fontSize(12).font('Helvetica-Bold').text('Información general');
  doc.font('Helvetica');
  doc.text(`Fecha de trabajo: ${new Date(note.workDate).toLocaleDateString('es-ES')}`);
  doc.text(`Formato: ${note.format === 'hours' ? 'Horas' : 'Material'}`);
  if (note.description) doc.text(`Descripción: ${note.description}`);
  doc.moveDown();

  // Cliente
  if (note.client) {
    doc.font('Helvetica-Bold').text('Cliente');
    doc.font('Helvetica');
    doc.text(`Nombre: ${note.client.name || note.client}`);
    if (note.client.cif) doc.text(`CIF: ${note.client.cif}`);
    if (note.client.email) doc.text(`Email: ${note.client.email}`);
    doc.moveDown();
  }

  // Proyecto
  if (note.project) {
    doc.font('Helvetica-Bold').text('Proyecto');
    doc.font('Helvetica');
    doc.text(`Nombre: ${note.project.name || note.project}`);
    if (note.project.projectCode) doc.text(`Código: ${note.project.projectCode}`);
    doc.moveDown();
  }

  // Contenido según formato
  if (note.format === 'material') {
    doc.font('Helvetica-Bold').text('Material');
    doc.font('Helvetica');
    doc.text(`Material: ${note.material}`);
    if (note.quantity) doc.text(`Cantidad: ${note.quantity} ${note.unit || ''}`);
  } else {
    doc.font('Helvetica-Bold').text('Horas');
    doc.font('Helvetica');
    if (note.hours) doc.text(`Horas totales: ${note.hours}`);
    if (note.workers && note.workers.length > 0) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text('Trabajadores:');
      doc.font('Helvetica');
      note.workers.forEach(w => doc.text(`  - ${w.name}: ${w.hours}h`));
    }
  }
  doc.moveDown();

  // Firma
  doc.font('Helvetica-Bold').text('Firma');
  doc.font('Helvetica');
  if (note.signed) {
    doc.text(`Firmado el: ${new Date(note.signedAt).toLocaleDateString('es-ES')}`);
    if (note.signatureUrl) {
      try {
        const imgBuffer = await fetchImageBuffer(note.signatureUrl);
        doc.moveDown(0.5);
        doc.image(imgBuffer, { width: 200 });
      } catch {
        doc.text('(imagen de firma no disponible)');
      }
    }
  } else {
    doc.text('Sin firmar');
  }

  doc.end();
  return done;
};
