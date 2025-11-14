import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { Resend } from "resend";
import PDFDocument from "pdfkit";
import getStream from "get-stream";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = await supabaseServer();

  // ---- LOAD REQUEST DATA ----
  const { data, error } = await supabase
    .from("service_requests")
    .select(
      `
      id,
      status,
      mileage,
      notes,
      started_at,
      completed_at,
      vehicle:vehicles(*),
      customer:customers(*),
      parts:request_parts(*),
      photos:request_photos(*)
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Request not found" },
      { status: 404 }
    );
  }

  // -------------------------------------------------------------------
  // 1) GENERATE PDF (same style as PDF download)
  // -------------------------------------------------------------------
  const doc = new PDFDocument();
  const pdfBuffer = await getStream.buffer(doc);

  doc.fontSize(20).text("Service Report", { underline: true });
  doc.moveDown();

  doc.fontSize(14).text(`Service Request ID: ${data.id}`);
  doc.text(`Status: ${data.status}`);
  doc.text(`Mileage: ${data.mileage || "—"}`);

  if (data.started_at)
    doc.text(`Started: ${new Date(data.started_at).toLocaleString()}`);
  if (data.completed_at)
    doc.text(`Completed: ${new Date(data.completed_at).toLocaleString()}`);

  doc.moveDown().fontSize(16).text("Vehicle", { underline: true });
  doc.fontSize(12).text(
    [
      data.vehicle?.year,
      data.vehicle?.make,
      data.vehicle?.model
    ].filter(Boolean).join(" ")
  );
  doc.text(`Unit: ${data.vehicle?.unit_number || "—"}`);
  doc.text(`Plate: ${data.vehicle?.plate || "—"}`);

  doc.moveDown().fontSize(16).text("Customer", { underline: true });
  doc.fontSize(12).text(data.customer?.name || "—");

  // PARTS
  doc.moveDown().fontSize(16).text("Parts Used", { underline: true });
  doc.fontSize(12);

  if (!data.parts?.length) {
    doc.text("No parts recorded.");
  } else {
    data.parts.forEach((p) => {
      doc.text(`• ${p.part_name} (${p.part_number || "no number"})`);
    });
  }

  // NOTES
  if (data.notes) {
    doc.moveDown().fontSize(16).text("Notes", { underline: true });
    doc.fontSize(12).text(data.notes);
  }

  doc.end();

  // -------------------------------------------------------------------
  // 2) EMAIL DESTINATIONS
  // -------------------------------------------------------------------
  const customerEmail = data.customer?.email;
  const officeEmail = "office@revlet.ai"; // CHANGE THIS
  const edsonEmail = "edson@revlet.ai";   // CHANGE THIS

  const recipients = [customerEmail, officeEmail, edsonEmail].filter(Boolean);

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "No email recipients found" },
      { status: 400 }
    );
  }

  // -------------------------------------------------------------------
  // 3) SEND EMAIL
  // -------------------------------------------------------------------
  const subject = `Service Report – Request ${data.id}`;

  try {
    await resend.emails.send({
      from: "Revlet Fleet <noreply@revlet.ai>",
      to: recipients,
      subject,
      text: "Your service report is attached as a PDF.",
      attachments: [
        {
          filename: `report-${data.id}.pdf`,
          content: pdfBuffer.toString("base64"),
          type: "application/pdf",
        },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
