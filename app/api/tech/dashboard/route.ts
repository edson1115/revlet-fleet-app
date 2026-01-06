import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // Filter for today's completed jobs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const { data: jobs, error } = await supabase
      .from("service_requests")
      .select(`*, vehicle:vehicles (*), customer:customers (*)`)
      .or(`status.in.(SCHEDULED,IN_PROGRESS),and(status.eq.COMPLETED,completed_at.gte.${todayStr})`)
      .order("scheduled_date", { ascending: true });

    if (error) throw error;

    // 🌟 THE FIX: Construct the name from parts
    const safeJobs = (jobs || []).map((job) => {
      const v = job.vehicle;
      const vehicleName = v ? `${v.year} ${v.make} ${v.model}` : "Unknown Vehicle";

      return {
        ...job,
        vehicle: { 
          ...v, 
          name: vehicleName, // Format: "2023 Ford F-150"
          vin: v?.vin || "N/A"
        },
        customer: job.customer || { name: "Unknown Customer" }
      };
    });

    const active = safeJobs.filter(j => j.status === "IN_PROGRESS");
    const scheduled = safeJobs.filter(j => j.status === "SCHEDULED");
    const completed = safeJobs.filter(j => j.status === "COMPLETED");

    return NextResponse.json({ ok: true, active, scheduled, completed });

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}