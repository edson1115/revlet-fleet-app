import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const body = await req.json().catch(() => ({}));

  const supabase = await supabaseServer();

  // Start job → set IN_PROGRESS + started_at
  if (body.op === "start") {
    const { error } = await supabase
      .from("service_requests")
      .update({
        status: "IN_PROGRESS",
        started_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  // Complete job → set COMPLETED + completed_at + optional tech summary
  if (body.op === "complete") {
    const note = body.note || null;

    const updates: any = {
      status: "COMPLETED",
      completed_at: new Date().toISOString(),
    };

    if (note) {
      updates.notes = note;
    }

    const { error } = await supabase
      .from("service_requests")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  // Reschedule → clear times, clear tech, push back to dispatch
  if (body.op === "reschedule") {
    const reason = body.reason || "Unknown";

    const { error } = await supabase
      .from("service_requests")
      .update({
        status: "WAITING_TO_BE_SCHEDULED",
        scheduled_at: null,
        started_at: null,
        completed_at: null,
        technician_id: null,
        dispatch_notes: `Tech send-back: ${reason}`,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid op" }, { status: 400 });
}
