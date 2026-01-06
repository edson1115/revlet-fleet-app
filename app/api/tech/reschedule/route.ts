import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const { id, reason, notes } = await req.json();

    console.log("↩️ RESCHEDULING JOB:", id, reason);

    // 1. Get current notes to append to them
    const { data: currentJob } = await supabase
      .from("service_requests")
      .select("description")
      .eq("id", id)
      .single();

    const newNote = `[TECH RETURNED]: ${reason} - ${notes || "No details"}`;
    const updatedDescription = currentJob?.description 
      ? `${currentJob.description}\n\n${newNote}`
      : newNote;

    // 2. Update Status and Notes
    const { error } = await supabase
      .from("service_requests")
      .update({
        status: "READY_TO_SCHEDULE", // Send back to Dispatch
        technician_id: null,         // Unassign the tech
        description: updatedDescription
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}