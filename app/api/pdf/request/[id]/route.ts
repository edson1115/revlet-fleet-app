// app/api/pdf/request/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { buildRequestPdf } from "@/lib/pdf/buildRequestPdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const supabase = await supabaseServer();

    // Fetch request with all related data
    const { data: row, error } = await supabase
      .from("service_requests")
      .select(
        `
        id, status, created_at, scheduled_at, started_at, completed_at,
        service, notes, dispatch_notes, po, fmc, fmc_text, mileage,
        customer:customer_id ( id, name, market ),
        vehicle:vehicle_id ( id, unit_number, year, make, model, plate ),
        location:location_id ( id, name ),
        technician:technician_id ( id, full_name ),
        images:request_photos ( id, kind, url_full, url_thumb, created_at )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) throw new Error("Request not found");

    const pdf = await buildRequestPdf(row);

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="request-${id}.pdf"`,
      },
    });
  } catch (e: any) {
    console.error("PDF ERROR:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
