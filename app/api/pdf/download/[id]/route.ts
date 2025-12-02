// app/api/pdf/download/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { generateRequestPDF } from "@/lib/pdf/generateRequestPDF";
import { logPDF } from "@/lib/pdf/log";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const requestId = context.params.id;

    const supabase = await supabaseServer();
    const { data: request, error } = await supabase
      .from("service_requests")
      .select(`
        *,
        customer:customer_id(name),
        vehicle:vehicle_id(year, make, model, plate, unit_number),
        location:location_id(name)
      `)
      .eq("id", requestId)
      .maybeSingle();

    if (!request || error) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Generate PDF
    const pdfBytes = await generateRequestPDF(request);

    // Log download
    await logPDF({
      requestId,
      action: "download",
      actor: "public",
      actorEmail: null,
      meta: { path: "direct-download" },
    });

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Request-${requestId}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
