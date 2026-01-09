import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

// 1. GET: Fetch Dashboard Counts (Fixes the 404 Error)
export async function GET() {
  const scope = await resolveUserScope();
  
  // Security Check: Only Dispatch/Admin can see these alerts
  if (!["DISPATCH", "ADMIN", "SUPERADMIN"].includes(scope.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await supabaseServer();

  // A. Ready to Schedule (The "To Do" list)
  const { count: ready } = await supabase
    .from("service_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "READY_TO_SCHEDULE");

  // B. Active Jobs (Currently happening)
  const { count: active } = await supabase
    .from("service_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "IN_PROGRESS");

  // C. Issues / Waiting (Needs attention)
  const { count: issues } = await supabase
    .from("service_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "WAITING");

  return NextResponse.json({
    alerts: {
      ready: ready || 0,
      active: active || 0,
      issues: issues || 0
    }
  });
}

// 2. POST: Create Dispatch Notification (Your existing code, kept safe)
export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const body = await req.json();

    const { vehicle_id } = body;
    if (!vehicle_id)
      return NextResponse.json({ error: "Missing vehicle_id" }, { status: 400 });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase.from("dispatch_notifications").insert([
      {
        vehicle_id,
        created_by: user.id,
        message: `Customer flagged vehicle ${vehicle_id} for urgent review`,
        status: "NEW",
      },
    ]);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", detail: `${err}` },
      { status: 500 }
    );
  }
}