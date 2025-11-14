// app/api/portal/invoice/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import PDFDocument from "pdfkit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  const supabase = await supabaseServer();

  // Load everything about the request
  const { data: row, error } = await supabase
    .from("service_requests")
    .select(
      `
        id, status, created_at, completed_at, mileage, po, notes,
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
      { error: error?.message || "Not found" },
      { status: 404 }
    );
  }

  // ---- Generate PDF ----
  const doc = new PDFDocument({ margin: 40 });

  const chunks: any[] = [];
  doc.on("data", (c) => chunks.push(c));
  doc.on("end", () => {});

  doc.fontSize(22).text("Service Invoice", { align: "center" });
  doc.moveDown();

  // VEHICLE
  doc.fontSize(14).text("Vehicle:", { bold: true });
  doc.fontSize(12).text(
    `${row.vehicle.year} ${row.vehicle.make} ${row.vehicle.model}`
  );
  doc.text(`Plate/Unit: ${row.vehicle.plate || row.vehicle.unit_number}`);
  doc.moveDown();

  // CUSTOMER
  doc.fontSize(14).text("Customer:", { bold: true });
  doc.fontSize(12).text(row.customer?.name ?? "—");
  doc.moveDown();

  // PARTS LIST
  doc.fontSize(14).text("Parts Used:", { bold: true });
  if (row.parts.length === 0) {
    doc.fontSize(12).text("No parts used.");
  } else {
    row.parts.forEach((p: any) => {
      doc.fontSize(12).text(
        `• ${p.part_name} ${p.part_number ? `(#${p.part_number})` : ""}`
      );
    });
  }
  doc.moveDown();

  // MILEAGE
  doc.fontSize(14).text("Mileage:", { bold: true });
  doc.fontSize(12).text(row.mileage || "—");
  doc.moveDown();

  // NOTES
  doc.fontSize(14).text("Tech Notes:", { bold: true });
  doc.fontSize(12).text(row.notes || "—");
  doc.moveDown();

  // DONE
  doc.end();

  const pdfBuffer = Buffer.concat(chunks);

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${id}.pdf"`,
    },
  });
}
