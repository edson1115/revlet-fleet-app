// lib/pdf/buildReport.ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function buildServiceReportPDF(request: any) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage();
  const { width, height } = page.getSize();

  const margin = 40;
  let cursor = height - margin;

  const drawText = (text: string, size = 12, color = rgb(0, 0, 0)) => {
    page.drawText(text, { x: margin, y: cursor, size, color });
    cursor -= size + 6;
  };

  const drawHeader = (label: string) => {
    cursor -= 10;
    drawText(label, 16, rgb(0, 0.2, 0.6));
    cursor -= 6;
  };

  /* ===========================
     REQUEST HEADER
     =========================== */
  drawHeader("Service Request Report");
  drawText(`Request ID: ${request.id}`);
  drawText(`Status: ${request.status}`);
  drawText(
    `Created: ${request.created_at ? new Date(request.created_at).toLocaleString() : "—"}`
  );

  /* ===========================
     CUSTOMER
     =========================== */
  drawHeader("Customer");
  drawText(`Name: ${request.customer?.name ?? "—"}`);

  /* ===========================
     VEHICLE
     =========================== */
  drawHeader("Vehicle");
  const v = request.vehicle;
  drawText(
    `Vehicle: ${(v?.year || "")} ${(v?.make || "")} ${(v?.model || "")}`.trim()
  );
  drawText(`Plate: ${v?.plate || "—"}`);
  drawText(`Unit: ${v?.unit_number || "—"}`);

  /* ===========================
     TECHNICIAN
     =========================== */
  drawHeader("Technician");
  drawText(request.technician?.full_name || "—");

  /* ===========================
     SERVICE INFO
     =========================== */
  drawHeader("Service Details");
  drawText(`Service: ${request.service || "—"}`);
  drawText(`Mileage: ${request.mileage ?? "—"}`);
  drawText(`PO: ${request.po || request.po_number || "—"}`);
  drawText(`Priority: ${request.priority || "NORMAL"}`);
  drawText(`FMC: ${request.fmc || "—"}`);

  /* ===========================
     NOTES
     =========================== */
  drawHeader("Notes");
  if (request.notes) {
    const wrapped = wrapText(request.notes, 95);
    wrapped.forEach((line) => drawText(line));
  } else {
    drawText("No notes.");
  }

  /* ===========================
     PARTS
     =========================== */
  drawHeader("Parts Used");
  if (request.parts?.length > 0) {
    request.parts.forEach((p: any) => {
      drawText(`• ${p.part_name} (${p.part_number || "no number"})`);
    });
  } else {
    drawText("No parts recorded.");
  }

  return await pdf.save();
}

/**
 * Simple text wrapper for long notes.
 */
function wrapText(text: string, max = 90) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const w of words) {
    if ((current + w).length > max) {
      lines.push(current);
      current = w + " ";
    } else {
      current += w + " ";
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}
