import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import { createServiceLog } from "@/lib/api/logs";

export async function POST(req: Request) {
  try {
    const scope = await resolveUserScope();
    
    if (!scope.uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // FIX: Use 'isSuperadmin' (correct property) instead of 'isSuper'
    if (!scope.isSuperadmin && scope.role !== "DISPATCH" && scope.role !== "ADMIN" && scope.role !== "OFFICE") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    // 1. Unassign the request (Clear schedule fields)
    const { error } = await supabase
      .from("service_requests")
      .update({
        technician_id: null,
        scheduled_at: null,
        status: "WAITING", // Revert to WAITING status
        updated_at: new Date().toISOString()
      })
      .eq("id", requestId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Log the unscheduling
    await createServiceLog({
      request_id: requestId,
      actor_id: scope.uid,
      actor_role: scope.role!,
      action: "UNSCHEDULED",
      details: {
        message: "Request removed from schedule",
        market: scope.active_market
      }
    });

    return NextResponse.json({ ok: true });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}