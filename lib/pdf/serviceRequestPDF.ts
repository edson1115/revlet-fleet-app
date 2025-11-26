import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function buildServiceRequestPDF({ request, photos }) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]); // Letter
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  let y = 750;

  function write(text: string, size = 12) {
    page.drawText(text, { x: 50, y, size, font, color: rgb(0, 0, 0) });
    y -= size + 6;
  }

  write(`Service Report — Request #${request.id}`, 20);
  y -= 10;

  write(`Customer: ${request.customer?.name || "—"}`);
  write(`Vehicle: ${request.vehicle?.year} ${request.vehicle?.make} ${request.vehicle?.model}`);
  write(`Status: ${request.status}`);
  write(`Mileage: ${request.mileage ?? "—"}`);
  y -= 20;

  const before = photos.filter((p) => p.kind === "BEFORE");
  const after = photos.filter((p) => p.kind === "AFTER");

  async function renderImages(label: string, imgs: any[]) {
    write(label.toUpperCase(), 16);
    y -= 10;

    for (const p of imgs) {
      const jpg = await fetch(p.url).then((r) => r.arrayBuffer());
      const img = await pdf.embedJpg(jpg);
      const { width, height } = img.scale(300 / img.width);

      if (y - height < 50) {
        y = 750;
        pdf.addPage();
      }

      page.drawImage(img, { x: 50, y: y - height, width, height });
      y -= height + 20;
    }
    y -= 10;
  }

  await renderImages("Before Photos", before);
  await renderImages("After Photos", after);

  return pdf.save();
}
