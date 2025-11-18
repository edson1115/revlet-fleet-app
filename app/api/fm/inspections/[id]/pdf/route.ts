// app/api/fm/inspections/[id]/pdf/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts } from "pdf-lib";


export const dynamic = "force-dynamic";

// your existing logic stays exactly the same...


/**
 * GET /api/fm/inspections/[id]/pdf
 * We DO NOT declare a typed RouteContext arg, so Next typegen
 * doesn’t try to validate params. We parse id from the URL instead.
 */
export async function GET(req: Request) {
  // Extract id from URL: /api/fm/inspections/:id/pdf
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  // ['api','fm','inspections',':id','pdf']
  const id = segments[segments.length - 2];

  if (!id) {
    return NextResponse.json(
      { error: "Missing inspection id in path" },
      { status: 400 }
    );
  }

  const supabase = await supabaseServer();

  // Load inspection + relations
  const { data: row, error } = await supabase
    .from("fm_inspections")
    .select(
      `
        id,
        created_at,
        customer:customer_id (
          id,
          name
        ),
        vehicle:vehicle_id (
          id,
          year,
          make,
          model
        ),
        items:fm_inspection_items (
          id,
          item,
          status,
          notes
        )
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json(
      { error: error?.message || "Inspection not found" },
      { status: 404 }
    );
  }

  // Loosen types so TS stops complaining about relationship shapes
  const r: any = row;
  const customerName =
    (Array.isArray(r.customer) ? r.customer[0]?.name : r.customer?.name) ??
    "N/A";
  const vehicleLabel = (() => {
    const v = Array.isArray(r.vehicle) ? r.vehicle[0] : r.vehicle;
    if (!v) return "";
    return [v.year, v.make, v.model].filter(Boolean).join(" ");
  })();

  // Build a simple PDF
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([600, 800]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  let y = 760;

  page.drawText(`Inspection Report #${r.id}`, {
    x: 40,
    y,
    size: 16,
    font,
  });

  y -= 30;
  page.drawText(`Customer: ${customerName}`, {
    x: 40,
    y,
    size: 12,
    font,
  });

  y -= 20;
  page.drawText(`Vehicle: ${vehicleLabel}`, {
    x: 40,
    y,
    size: 12,
    font,
  });

  y -= 30;
  page.drawText("Inspection Items:", {
    x: 40,
    y,
    size: 14,
    font,
  });

  for (const item of r.items ?? []) {
    y -= 20;
    page.drawText(
      `• ${item.item} — ${item.status}${
        item.notes ? " (" + item.notes + ")" : ""
      }`,
      {
        x: 60,
        y,
        size: 10,
        font,
      }
    );
  }

  const pdfBytes = await pdf.save();

  // Use Uint8Array directly; cast to any to satisfy TS BodyInit
  return new NextResponse(pdfBytes as any, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="inspection-${id}.pdf"`,
    },
  });
}
