// app/api/pdf/email/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseServer } from "@/lib/supabase/server";
import { generateRequestPDF } from "@/lib/pdf/generateRequestPDF";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { requestId, email } = await req.json();
    if (!requestId || !email)
      return NextResponse.json({ error: "Missing requestId or email" }, { status: 400 });

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

    if (error || !request)
      return NextResponse.json({ error: "Request not found" }, { status: 404 });

    // Generate PDF
    const pdfBytes = await generateRequestPDF(request);

    // Send email
    const send = await resend.emails.send({
      from: "Revlet <no-reply@revlet.app>",
      to: email,
      subject: `Service Request #${requestId}`,
      text: "Attached is your service request report.",
      attachments: [
        {
          filename: `Request-${requestId}.pdf`,
          content: pdfBytes.toString("base64"),
          encoding: "base64",
        },
      ],
    });

    return NextResponse.json({ ok: true, send });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message || "Failed to send email" },
      { status: 500 }
    );
  }
}



