import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { generateRequestPDF } from "@/lib/pdf/generateRequestPDF";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;

    const supabase = await supabaseServer();

    // Fetch the request data
    const { data: row, error } = await supabase
      .from("service_requests")
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*)
      `)
      .eq("id", id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Generate PDF
    const pdfBytes = await generateRequestPDF(row);

    // FIX: Convert Uint8Array to Buffer to satisfy BodyInit type
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="request-${id}.pdf"`,
      },
    });

  } catch (err: any) {
    console.error("PDF Request Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}