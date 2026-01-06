import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const { id, date, tech } = await req.json();

    console.log("📅 SCHEDULING JOB:", { id, date });

    const { error } = await supabase
      .from("service_requests")
      .update({
        status: "SCHEDULED",
        scheduled_date: date,
        technician_id: tech || null 
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}