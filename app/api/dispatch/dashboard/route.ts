import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { data: rawJobs, error } = await supabase
      .from("service_requests")
      .select(`*, vehicle:vehicles (*), customer:customers (*)`)
      .eq("status", "READY_TO_SCHEDULE")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 🌟 THE FIX: Construct the name from parts
    const safeQueue = (rawJobs || []).map((job) => {
      const v = job.vehicle;
      const vehicleName = v ? `${v.year} ${v.make} ${v.model}` : "Unknown Vehicle";
      
      return {
        ...job,
        vehicle: { 
          ...v, 
          name: vehicleName, // We manually create the 'name' property here
          vin: v?.vin || "N/A"
        },
        customer: job.customer || { name: "Unknown Customer" }
      };
    });

    const count = safeQueue.length;

    return NextResponse.json({
      ok: true,
      stats: { unassigned: count, ready: count, pending: count, scheduled: 0 },
      queue: safeQueue, 
      rows: safeQueue   
    });

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}