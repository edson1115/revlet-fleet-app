import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import { logActivity } from "@/lib/audit/logActivity";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Parse Body First
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

    // 4. CALL DATABASE FUNCTION (RPC)
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

    // Handle RPC response structure
    // Check if result is null or if 'ok' property is missing/false
    if (!result || (typeof result === 'object' && 'ok' in result && !result.ok)) {
       const errMsg = (result && result.error) ? result.error : "Update failed.";
       return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    // 5. Log Activity
    // FIX: Structure the log input correctly. 'message' and 'meta' go inside 'details'.
    await logActivity({
      request_id: id,
      actor_id: scope.uid,
      actor_role: scope.role!,
      action: "STATUS_CHANGE",
      details: {
        message: `Technician changed status to ${body.status}`,
        new_status: body.status,
        previous_status: result.data?.status || "unknown"
      }
    });

    return NextResponse.json({ ok: true, request: result.data || result });

  } catch (e: any) {
    console.error("Tech API Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}