import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseServer } from "@/lib/supabase/server";
import { generateRequestPDF } from "@/lib/pdf/generateRequestPDF";

export async function POST(req: Request) {
  // FIX: Initialize Resend inside the handler. 
  // This prevents Next.js from crashing during build-time static analysis.
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { requestId, email } = await req.json();

    if (!requestId || !email) {
      return NextResponse.json({ error: "Missing requestId or email" }, { status: 400 });
    }

    // Fetch request data
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

    if (error || !request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Generate PDF (returns Uint8Array)
    const pdfBytes = await generateRequestPDF(request);

    // Convert Uint8Array to Buffer to access .toString("base64")
    const pdfBuffer = Buffer.from(pdfBytes);
    const base64Content = pdfBuffer.toString("base64");

    // Send email
    const { data: send, error: sendError } = await resend.emails.send({
      from: "Revlet <no-reply@revlet.app>", 
      to: email,
      subject: `Service Request #${requestId}`,
      html: "<p>Attached is your service request report.</p>",
      attachments: [
        {
          filename: `Request-${requestId}.pdf`,
          content: base64Content,
        },
      ],
    });

    if (sendError) {
        console.error("Resend Error:", sendError);
        return NextResponse.json({ error: "Failed to send email via Resend" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, send });

  } catch (err: any) {
    console.error("Email API Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to send email" },
      { status: 500 }
    );
  }
}