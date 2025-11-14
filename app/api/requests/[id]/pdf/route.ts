import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * GET /api/requests/:id/pdf
 * Tesla-style service report generator
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  const supabase = await supabaseServer();

  /* ------------------------------
     Load service request + joins
  ------------------------------- */
  const { data: row, error } = await supabase
    .from("service_requests")
    .select(
      `
        id, service, status,
        created_at, scheduled_at, started_at, completed_at,
        mileage, notes,
        customer:customer_id ( name ),
        vehicle:vehicle_id ( year, make, model, plate, unit_number ),
        parts:request_parts ( id, part_name, part_number ),
        photos:request_photos ( id, url, kind )
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json(
      { error: "Request not found" },
      { status: 404 }
    );
  }

  /* ------------------------------
     Create PDF doc + fonts
  ------------------------------- */
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();

  let y = 800;

  /* ------------------------------
     Utility drawing functions
  ------------------------------- */
  function title(text: string) {
    page.drawText(text, {
      x: 40,
      y,
      size: 28,
      font: bold,
      color: rgb(0, 0, 0),
    });
    y -= 40;
  }

  function section(text: string) {
    page.drawText(text, {
      x: 40,
      y,
      size: 14,
      font: bold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 20;
  }

  function line(label: string, value: any) {
    if (y < 80) newPage();
    page.drawText(`${label}: ${value ?? "—"}`, {
      x: 60,
      y,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 16;
  }

  function spacer(amount = 10) {
    y -= amount;
    if (y < 80) newPage();
  }

  function newPage() {
    const pg = pdf.addPage([595, 842]);
    y = 800;
    pg.drawText("Revlet Fleet — Service Report", {
      x: 40,
      y: 820,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    page = pg;
  }

  /* ------------------------------
     Header / Branding
  ------------------------------- */
  page.drawText("REVLET FLEET", {
    x: 40,
    y: 820,
    size: 12,
    font: bold,
    color: rgb(0, 0, 0),
  });

  title("Service Report");

  /* ------------------------------
     Request + Vehicle Section
  ------------------------------- */
  section("Vehicle");
  line(
    "Vehicle",
    `${row.vehicle?.year} ${row.vehicle?.make} ${row.vehicle?.model}`
  );
  line("Plate / Unit", row.vehicle?.plate || row.vehicle?.unit_number);

  spacer();

  section("Customer");
  line("Customer", row.customer?.name);

  spacer();

  section("Service");
  line("Service", row.service);
  line("Status", row.status);
  line("Created", row.created_at);
  line("Scheduled", row.scheduled_at);
  line("Started", row.started_at);
  line("Completed", row.completed_at);
  line("Mileage", row.mileage);

  /* ------------------------------
     Parts Section
  ------------------------------- */
  spacer();
  section("Parts Used");

  if (!row.parts || row.parts.length === 0) {
    line("Parts", "No parts recorded");
  } else {
    for (const p of row.parts) {
      line(`• ${p.part_name}`, p.part_number || "—");
    }
  }

  /* ------------------------------
     Technician Notes
  ------------------------------- */
  spacer();
  section("Technician Notes");
  line("", row.notes);

  /* ------------------------------
     Photo Grid (Before / After)
  ------------------------------- */
  spacer(20);
  section("Photos");

  if (!row.photos || row.photos.length === 0) {
    line("Photos", "None uploaded.");
  } else {
    for (const p of row.photos) {
      const res = await fetch(p.url);
      const buffer = await res.arrayBuffer();

      // Support JPG or PNG
      const img =
        p.url.toLowerCase().endsWith(".png")
          ? await pdf.embedPng(buffer)
          : await pdf.embedJpg(buffer);

      const imgWidth = 220;
      const imgHeight = (img.height / img.width) * imgWidth;

      if (y - imgHeight < 80) newPage();

      page.drawImage(img, {
        x: 40,
        y: y - imgHeight,
        width: imgWidth,
        height: imgHeight,
      });

      page.drawText(p.kind.toUpperCase(), {
        x: 40,
        y: y - imgHeight - 14,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });

      y -= imgHeight + 40;
    }
  }

  /* ------------------------------
     Return PDF
  ------------------------------- */
  const pdfBytes = await pdf.save();

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="service-report-${id}.pdf"`,
    },
  });
}
