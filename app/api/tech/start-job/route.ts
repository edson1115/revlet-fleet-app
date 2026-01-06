import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const { id } = await req.json(); // Get the Job ID from the button click
    
    // Get the current Tech (User)
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    console.log("🔧 STARTING JOB:", id);

    // Update the Job in the Database
    const { error } = await supabase
      .from("service_requests")
      .update({
        status: "IN_PROGRESS",          // Change status
        started_at: new Date().toISOString(), // Mark the time
        technician_id: user.id          // "Claim" the job (assign to self)
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Start Job Error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}