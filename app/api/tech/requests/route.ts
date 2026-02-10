import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import { createServiceLog } from "@/lib/api/logs";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing request ID" }, { status: 400 });
    }

    const scope = await resolveUserScope();
    if (!scope.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await supabaseServer();

    // 1. Fetch current request to validate permissions
    const { data: current, error: fetchErr } = await supabase
      .from("service_requests")
      .select("technician_id, status")
      .eq("id", id)
      .single();

    if (fetchErr || !current) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // 2. Permission Check: Only assigned tech or admins can update
    // (Assuming scope.role is checked, or tech ID match)
    if (scope.isTech && current.technician_id !== scope.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Update the request
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.notes) updateData.notes = body.notes;
    if (body.mileage) updateData.reported_mileage = body.mileage;
    
    // Add timestamps based on status
    if (body.status === "IN_PROGRESS") updateData.started_at = new Date().toISOString();
    if (body.status === "COMPLETED") updateData.completed_at = new Date().toISOString();

    updateData.updated_at = new Date().toISOString();

    const { data: updated, error: updateErr } = await supabase
      .from("service_requests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 4. Log the action
    // FIX: Structure 'message' inside 'details' object
    if (body.status && body.status !== current.status) {
      await createServiceLog({
        request_id: id,
        actor_id: scope.uid,
        actor_role: scope.role!,
        action: "STATUS_CHANGE",
        details: { 
          message: `Technician changed status to ${body.status}`,
          previous_status: current.status,
          new_status: body.status,
          mileage: body.mileage
        }
      });
    }

    return NextResponse.json({ request: updated });

  } catch (err: any) {
    console.error("Tech Request Update Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}