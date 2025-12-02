import { NextResponse } from "next/server";
import JSZip from "jszip";
import { supabaseServer } from "@/lib/supabase/server";
import { generateRequestPDF } from "@/lib/pdf/generateRequestPDF";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    const supabase = await supabaseServer();
    const zip = new JSZip();

    for (const id of ids) {
      const { data: request, error } = await supabase
        .from("service_requests")
        .select(
          `
          *,
          customer:customer_id(name),
          vehicle:vehicle_id(year, make, model, plate, unit_number),
          location:location_id(name)
        `
        )
        .eq("id", id)
        .maybeSingle();

      if (!request || error) continue;

      const pdfBytes = await generateRequestPDF(request);

      zip.file(`Request-${id}.pdf`, pdfBytes);
    }

    const zipBytes = await zip.generateAsync({ type: "uint8array" });

    return new NextResponse(zipBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="requests.zip"`,
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message || "Failed to export PDFs" },
      { status: 500 }
    );
  }
}
