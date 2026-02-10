import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { generateRequestPDF } from "@/lib/pdf/generateRequestPDF";
import { logPDF } from "@/lib/pdf/log";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> } // Fix: Correct Next.js 15 type
) {
  try {
    // Fix: Await params
    const params = await props.params;
    const requestId = params.id;

    const supabase = await supabaseServer();
    
    // Fetch request data (even though your generator might just take ID, 
    // it's good practice to verify existence first)
    const { data: request, error } = await supabase
      .from("service_requests")
      .select("id") // Only selecting ID since your generator takes string
      .eq("id", requestId)
      .maybeSingle();

    if (!request || error) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Generate PDF
    // Note: Your provided generator takes (requestId: string), so we pass that.
    const pdfBytes = await generateRequestPDF(requestId);

    // Log download
    await logPDF({
      requestId,
      action: "download",
      actor: "public",
      actorEmail: null,
      meta: { path: "direct-download" },
    });

    // Fix: Cast Uint8Array to Buffer for NextResponse to satisfy BodyInit type
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Request-${requestId}.pdf"`,
      },
    });

  } catch (err: any) {
    console.error("PDF Download Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}