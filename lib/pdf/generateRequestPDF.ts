import { PDFDocument } from 'pdf-lib';

export async function generateRequestPDF(requestId: string): Promise<Uint8Array> {
  // Simple placeholder PDF generation to pass the build
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  page.drawText(`Revlet Request: ${requestId}`, { x: 50, y: 700 });
  return await pdfDoc.save();
}