// lib/pdf/buildRequestPdf.ts
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function buildRequestPdf(row: any): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]); // Letter size

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 750;

  function heading(text: string) {
    page.drawText(text, { x: 40, y, size: 18, font: bold });
    y -= 28;
  }

  function labelValue(label: string, value: string) {
    page.drawText(label + ": ", {
      x: 40,
      y,
      size: 12,
      font: bold,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(value || "—", {
      x: 150,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 18;
  }

  heading(`Service Request #${String(row.id).slice(0, 8)}`);

  labelValue("Status", row.status);
  labelValue(
    "Created",
    row.created_at ? new Date(row.created_at).toLocaleString() : "—"
  );
  labelValue(
    "Scheduled",
    row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : "—"
  );
  y -= 10;

  heading("Customer");
  labelValue("Name", row.customer?.name ?? "—");
  labelValue("Market", row.customer?.market ?? "—");

  y -= 10;

  heading("Vehicle");
  const v = row.vehicle?.[0] || row.vehicle;
  labelValue(
    "Vehicle",
    v
      ? `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""} (#${v.unit_number ?? ""})`
      : "—"
  );
  labelValue("Plate", v?.plate ?? "—");

  y -= 10;

  heading("Location");
  labelValue("Shop", row.location?.[0]?.name ?? row.location?.name ?? "—");

  y -= 10;

  heading("Service Details");
  labelValue("Service", row.service ?? "—");
  labelValue("PO", row.po ?? "—");
  labelValue("FMC", row.fmc_text || row.fmc || "—");
  labelValue("Mileage", row.mileage != null ? `${row.mileage} mi` : "—");

  y -= 10;

  heading("Notes");
  labelValue("Office Notes", row.notes ?? "—");
  labelValue("Dispatcher Notes", row.dispatch_notes ?? "—");

  // Photos
  if (row.images && row.images.length) {
    y -= 10;
    heading("Photos");

    for (const img of row.images.slice(0, 6)) {
      if (!img.url_full) continue;

      try {
        const jpg = await fetch(img.url_full).then((r) => r.arrayBuffer());
        const embedded = await pdf.embedJpg(jpg);

        const w = 120;
        const h = (120 / embedded.width) * embedded.height;

        page.drawImage(embedded, {
          x: 40,
          y: y - h,
          width: w,
          height: h,
        });

        y -= h + 10;
      } catch (err) {
        console.error("Image embed failed:", err);
      }
    }
  }

  return await pdf.save();
}



