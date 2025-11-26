// app/api/requests/[id]/email/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase/server";
import { buildServiceReportPDF } from "@/lib/pdf/buildReport";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(_: Request, { params }: any) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("view_requests")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const pdfBytes = await buildServiceReportPDF(data);

  await resend.emails.send({
    from: "Service Reports <noreply@revlet.ai>",
    to: data.customer_email || "edsoncortes@outlook.com",
    subject: "Your Service Report",
    text: "Attached is your completed service report.",
    attachments: [
      {
        filename: `service-report-${params.id}.pdf`,
        content: Buffer.from(pdfBytes).toString("base64"),
      },
    ],
  });

  return NextResponse.json({ ok: true });
}
