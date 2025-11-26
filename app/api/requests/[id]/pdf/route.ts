// app/api/requests/[id]/pdf/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { buildServiceReportPDF } from "@/lib/pdf/buildReport";

export async function GET(_: Request, { params }: any) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("view_requests") // the combined view
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const pdfBytes = await buildServiceReportPDF(data);

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="service-report-${params.id}.pdf"`,
    },
  });
}
