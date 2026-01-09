import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function POST(req: Request) {
  try {
    const scope = await resolveUserScope();

    // 1. Security Check: Only Dispatch or Admins can assign jobs
    if (!["DISPATCH", "ADMIN", "SUPERADMIN"].includes(scope.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Support both single ID or array (grab the first one if it's an array)
    // Your UI seems to send 'tech_ids' array, but we need a single 'technician_id' for the dashboard
    let technician_id = body.technician_id;
    if (!technician_id && Array.isArray(body.tech_ids) && body.tech_ids.length > 0) {
      technician_id = body.tech_ids[0];
    }

    const request_id = body.id || body.request_id;
    const scheduled_date = body.when || body.scheduled_date;

    if (!request_id || !technician_id) {
      return NextResponse.json({ error: "Missing request ID or Technician ID" }, { status: 400 });
    }

    // 2. Use Admin Client (Bypass RLS) to ensure the write succeeds
    const supabase = supabaseService();

    // 3. Perform the Update
    // We update the specific columns the Tech Dashboard is filtering on
    const { data, error } = await supabase
      .from("service_requests")
      .update({
        technician_id: technician_id,
        scheduled_start_at: scheduled_date ? new Date(scheduled_date).toISOString() : new Date().toISOString(),
        status: "SCHEDULED",
        // Map your 'notes' field to 'office_notes' or 'dispatch_notes' depending on your schema
        office_notes: body.notes || null 
      })
      .eq("id", request_id)
      .select()
      .single();

    if (error) {
      console.error("Assign Error (DB):", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. Log the Activity
    // This allows the history tab to show who assigned the job
    await supabase.from("activity_log").insert({
      request_id: request_id,
      actor_id: scope.uid,
      actor_role: scope.role,
      action: "ASSIGN_TECH",
      message: `Assigned to technician ${technician_id}`,
    });

    return NextResponse.json({ ok: true, request: data });

  } catch (error: any) {
    console.error("Assign Error (Server):", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}