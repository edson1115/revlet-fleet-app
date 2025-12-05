// lib/pdf/inspectionPdf.ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function buildInspectionPdf(inspection: any) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 800;

  const text = (t: string, size = 12, boldFont = false) => {
    page.drawText(t, {
      x: 40,
      y,
      size,
      font: boldFont ? bold : font,
      color: rgb(0, 0, 0),
    });
    y -= size + 10;
  };

  text("REVLET FLEET — Inspection Report", 18, true);
  y -= 10;

  text(`Customer: ${inspection.customer_name}`, 12, true);
  text(`Date: ${inspection.created_at}`, 12);

  y -= 10;

  text("Vehicle Info", 14, true);
  text(`${inspection.vehicle.year} ${inspection.vehicle.make} ${inspection.vehicle.model}`);
  text(`Unit: ${inspection.vehicle.unit_number}`);
  text(`Plate: ${inspection.vehicle.plate}`);

  y -= 10;
  text("Checklist Results", 14, true);

  for (const section in inspection.checklist) {
    text(section, 12, true);

    for (const item in inspection.checklist[section]) {
      const checked = inspection.checklist[section][item];
      text(`• ${item}: ${checked ? "OK" : "Needs Attention"}`, 11);
    }

    y -= 5;
  }

  y -= 10;
  text("Notes", 14, true);
  text(inspection.notes || "No notes provided.");

  // later: embed photos (we already do this for service requests)

  const bytes = await pdf.save();
  return bytes;
}



