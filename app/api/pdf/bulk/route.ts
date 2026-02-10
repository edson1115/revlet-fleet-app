import { NextResponse } from "next/server";
import JSZip from "jszip";
import { generateInvoicePDF } from "@/lib/pdf/invoiceGenerator"; // Ensure this path is correct
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { requestIds } = await req.json();

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    const supabase = await supabaseServer();
    const zip = new JSZip();

    // Fetch all requests
    const { data: requests, error } = await supabase
      .from("service_requests")
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*)
      `)
      .in("id", requestIds);

    if (error || !requests) {
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }

    // Generate PDFs and add to ZIP
    for (const req of requests) {
      const pdfBytes = await generateInvoicePDF(req);
      const filename = `Invoice_${req.unit_number || req.plate}_${req.id.slice(0, 6)}.pdf`;
      zip.file(filename, pdfBytes);
    }

    // Generate ZIP file
    const zipBytes = await zip.generateAsync({ type: "uint8array" });

    // FIX: Convert Uint8Array to Buffer to satisfy BodyInit type
    return new NextResponse(Buffer.from(zipBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="invoices.zip"',
      },
    });

  } catch (err: any) {
    console.error("Bulk PDF Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}