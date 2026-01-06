import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    // Fetch COMPLETED jobs
    const { data: jobs, error } = await supabase
      .from("service_requests")
      .select(`
        *,
        vehicle:vehicles (*),
        customer:customers (*),
        technician:users!technician_id (email) 
      `)
      .eq("status", "COMPLETED")
      .order("completed_at", { ascending: false }); // Newest finished first

    if (error) throw error;

    return NextResponse.json({ ok: true, jobs });

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}