import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    // We get the specific tech ID here
    const { id, date, time, technician_id } = await req.json();

    console.log("📅 SCHEDULING JOB:", { id, date, time, technician_id });

    // Combine Date & Time into one timestamp
    const scheduledDate = new Date(`${date}T${time}:00`);

    const { error } = await supabase
      .from("service_requests")
      .update({
        status: "SCHEDULED",
        scheduled_date: scheduledDate.toISOString(),
        technician_id: technician_id // <--- Assigns the job to the specific person
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}