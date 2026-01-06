import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // 1. Fetch SCHEDULED jobs
    const { data: rawJobs, error } = await supabase
      .from("service_requests")
      .select(`
        *,
        vehicle:vehicles (*),
        customer:customers (*)
      `)
      .eq("status", "SCHEDULED") // <--- Only show scheduled jobs
      .order("scheduled_date", { ascending: true }); // Show soonest first

    if (error) throw error;

    // 2. Sanitize (Crash Proofing)
    const safeQueue = (rawJobs || []).map((job) => ({
      ...job,
      vehicle: job.vehicle || { name: "Unknown Vehicle", vin: "N/A" },
      customer: job.customer || { name: "Unknown Customer" }
    }));

    console.log("📅 SCHEDULED API FETCH:", { count: safeQueue.length });

    return NextResponse.json({
      ok: true,
      jobs: safeQueue 
    });

  } catch (e: any) {
    console.error("Scheduled API Error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}