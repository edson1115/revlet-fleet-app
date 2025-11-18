// app/api/requests/[id]/pdf/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const dynamic = "force-dynamic";

type Params = { id: string };
type RouteContext = { params: Promise<Params> };

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await supabaseServer();

  const { data: request, error } = await supabase
    .from("requests")
    .select(
      `
      id,
      status,
      mileage,
      customers ( name ),
      vehicles (
        unit_number,
        year,
        make,
        model,
        plate
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const customer = Array.isArray(request.customers)
    ? request.customers[0]
    : request.customers;

  const vehicle = Array.isArray(request.vehicles)
    ? request.vehicles[0]
    : request.vehicles;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([600, 800]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  let y = 760;

  const draw = (label: string, value: any) => {
    page.drawText(`${label}: ${value ?? "N/A"}`, {
      x: 40,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 20;
  };

  draw("Request ID", request.id);
  draw("Status", request.status);
  draw("Mileage", request.mileage);
  draw("Customer", customer?.name);

  draw(
    "Vehicle",
    `${vehicle?.year ?? ""} ${vehicle?.make ?? ""} ${vehicle?.model ?? ""}`.trim()
  );

  draw("Plate", vehicle?.plate);
  draw("Unit #", vehicle?.unit_number);

  const pdfBytes = await pdf.save();

  // ⭐ GUARANTEED FIX: Convert to a real ArrayBuffer (never SharedArrayBuffer)
  const safeBuffer = new Uint8Array(pdfBytes).buffer;

  const blob = new Blob([safeBuffer], { type: "application/pdf" });

  return new NextResponse(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="request-${id}.pdf"`,
    },
  });
}
