import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function GET(_: Request, { params }: any) {
  try {
    const requestId = params.id;
    const supabase = await supabaseServer();

    // --- Load request ---
    const { data: req, error: reqErr } = await supabase
      .from("service_requests")
      .select("*, customers(*), vehicles(*)")
      .eq("id", requestId)
      .maybeSingle();

    if (reqErr || !req) throw new Error("Request not found");

    // --- Load photos ---
    const { data: beforePhotos } = await supabase
      .storage.from("request_photos")
      .list(`${requestId}/before`);

    const { data: afterPhotos } = await supabase
      .storage.from("request_photos")
      .list(`${requestId}/after`);

    // --- Create PDF ---
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 800;

    // ---------- HEADER ----------
    page.drawText("Service Report", { x: 40, y, size: 24, font: bold });
    y -= 40;

    page.drawText(`Request ID: ${req.id}`, { x: 40, y, size: 12, font });
    y -= 15;

    page.drawText(`Date: ${new Date(req.completed_at).toLocaleString()}`, {
      x: 40,
      y,
      size: 12,
      font,
    });
    y -= 30;

    // ---------- CUSTOMER / VEHICLE ----------
    page.drawText("Customer", { x: 40, y, size: 14, font: bold });
    y -= 16;

    page.drawText(`${req.customers.name}`, { x: 40, y, size: 12, font });
    y -= 20;

    page.drawText("Vehicle", { x: 40, y, size: 14, font: bold });
    y -= 16;

    page.drawText(
      `${req.vehicles.year} ${req.vehicles.make} ${req.vehicles.model}`,
      { x: 40, y, size: 12, font }
    );
    y -= 15;

    page.drawText(`Plate: ${req.vehicles.plate}`, {
      x: 40,
      y,
      size: 12,
      font,
    });

    y -= 30;

    // ---------- SERVICE DETAILS ----------
    page.drawText("Service Performed", { x: 40, y, size: 14, font: bold });
    y -= 18;

    page.drawText(`${req.service_type}`, { x: 40, y, size: 12, font });
    y -= 20;

    // Parts
    if (req.parts_used) {
      page.drawText("Parts Used", { x: 40, y, size: 14, font: bold });
      y -= 18;

      const parts = req.parts_used.split("\n");
      parts.forEach((p: string) => {
        page.drawText(`• ${p}`, { x: 40, y, size: 12, font });
        y -= 14;
      });

      y -= 8;
    }

    // Notes
    if (req.notes) {
      page.drawText("Technician Notes", { x: 40, y, size: 14, font: bold });
      y -= 18;

      const notes = req.notes.split("\n");
      notes.forEach((n: string) => {
        page.drawText(n, { x: 40, y, size: 12, font });
        y -= 14;
      });

      y -= 20;
    }

    // ---------- PHOTOS ----------
    // Put photos on a new page if needed
    const photoPage = pdf.addPage([595, 842]);
    let py = 780;

    const drawGroup = async (title: string, list: any[]) => {
      photoPage.drawText(title, { x: 40, y: py, size: 16, font: bold });
      py -= 30;

      for (const file of list) {
        const { data } = await supabase.storage
          .from("request_photos")
          .download(file.name ? `${requestId}/${title.toLowerCase()}/${file.name}` : file);

        if (!data) continue;

        const bytes = await data.arrayBuffer();
        const img = await pdf.embedJpg(bytes);

        const w = 200;
        const h = (img.height / img.width) * w;

        photoPage.drawImage(img, {
          x: 40,
          y: py - h,
          width: w,
          height: h,
        });

        py -= h + 20;
      }

      py -= 20;
    };

    if (beforePhotos?.length) {
      await drawGroup("Before", beforePhotos);
    }

    if (afterPhotos?.length) {
      await drawGroup("After", afterPhotos);
    }

    // ---------- SAVE PDF ----------
    const pdfBytes = await pdf.save();

    // Store in db
    const { data: share } = await supabase
      .from("pdf_shares")
      .insert({
        request_id: req.id,
        pdf_bytes: pdfBytes,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days
      })
      .select()
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      url: `/share/pdf/${share.id}`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
