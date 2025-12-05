import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { buildRequestPdf } from "@/lib/pdf/buildRequestPdf";

export async function POST(req: Request) {
  try {
    const { requestId, expiresInHours = 48 } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    // Fetch request with full data
    const { data: row, error } = await supabase
      .from("service_requests")
      .select(`
        *,
        customer:customer_id ( id, name, market ),
        vehicle:vehicle_id ( id, unit_number, year, make, model, plate ),
        location:location_id ( id, name ),
        technician:technician_id ( id, full_name ),
        images:request_photos ( id, kind, url_full, url_thumb, created_at )
      `)
      .eq("id", requestId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) throw new Error("Request not found");

    const pdfBytes = await buildRequestPdf(row);

    const expires_at = new Date(Date.now() + expiresInHours * 3600 * 1000)
      .toISOString();

    const { data: linkRow, error: insertErr } = await supabase
      .from("pdf_shares")
      .insert({
        request_id: requestId,
        pdf_bytes: pdfBytes,
        expires_at,
      })
      .select()
      .single();

    if (insertErr) throw new Error(insertErr.message);

    return NextResponse.json({
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/share/pdf/${linkRow.id}`,
      expires_at,
    });
  } catch (e: any) {
    console.error("PDF Share Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}



