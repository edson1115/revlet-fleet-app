import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import { createServiceLog } from "@/lib/api/logs"; // FIX: Use createServiceLog instead of logActivity

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Parse Body
    const body = await req.json();
    if (!body.status) {
      return NextResponse.json({ error: "Missing 'status' in request body" }, { status: 400 });
    }

    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    // 2. Auth Check
    if (!scope.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Verify Job Assignment
    const { data: job } = await supabase
      .from("service_requests")
      .select("technician_id, second_technician_id")
      .eq("id", id)
      .single();

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const isAssigned = 
      job.technician_id === scope.uid || 
      job.second_technician_id === scope.uid;
    
    const isAdmin = ["ADMIN", "DISPATCH", "SUPERADMIN"].includes(scope.role || "");

    if (!isAssigned && !isAdmin) {
      return NextResponse.json({ error: "You are not assigned to this job" }, { status: 403 });
    }

    // 4. Update Status (Using RPC as requested)
    const { data: result, error } = await supabase.rpc("update_job_status", {
      p_request_id: id,
      p_new_status: body.status,
      p_notes: body.notes || null,
      p_user_id: scope.uid,
      p_user_role: scope.role
    });

    if (error) {
      console.error("RPC Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 5. Log Activity
    // FIX: switched to createServiceLog which supports 'details'
    await createServiceLog({
      request_id: id,
      actor_id: scope.uid,
      actor_role: scope.role!,
      action: "STATUS_CHANGE",
      details: {
        message: `Technician changed status to ${body.status}`,
        new_status: body.status,
        previous_status: result?.status || "unknown"
      }
    });

    return NextResponse.json({ ok: true, request: result });

  } catch (e: any) {
    console.error("Tech API Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}