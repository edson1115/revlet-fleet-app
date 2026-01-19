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
    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    // 1. Auth Check
    if (!scope.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch Job to Verify Assignment
    // We use the standard client here (respecting RLS read rules)
    const { data: job } = await supabase
      .from("service_requests")
      .select("technician_id, second_technician_id")
      .eq("id", id)
      .single();

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 3. Verify User is Assigned (or is Admin)
    const isAssigned = 
      job.technician_id === scope.uid || 
      job.second_technician_id === scope.uid;
    
    const isAdmin = ["ADMIN", "DISPATCH", "SUPERADMIN"].includes(scope.role);

    if (!isAssigned && !isAdmin) {
      return NextResponse.json({ error: "You are not assigned to this job" }, { status: 403 });
    }

    // 4. Parse Request Body
    const body = await req.json();
    if (!body.status) {
      return NextResponse.json({ error: "Missing 'status' in request body" }, { status: 400 });
    }

    // 5. CALL DATABASE FUNCTION (The Fix)
    // We use the RPC function to bypass RLS write blocks safely.
    // Note the "p_" prefixes to match the SQL function parameters.
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

    if (!result || !result.ok) {
      return NextResponse.json({ 
        error: result?.error || "Update failed. Database returned error." 
      }, { status: 404 });
    }

    // 6. Log Activity
    await logActivity({
      request_id: id,
      actor_id: scope.uid,
      actor_role: scope.role,
      action: "STATUS_CHANGE",
      message: `Technician changed status to ${body.status}`,
      meta: { 
        status: body.status,
        previous_status: result.data?.status 
      }
    });

    return NextResponse.json({ ok: true, request: result.data });

  } catch (e: any) {
    console.error("Tech API Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}