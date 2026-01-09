import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { isValidTransition } from "@/lib/workflow/statusTransitions";
import { logActivity } from "@/lib/audit/logActivity";

export const dynamic = "force-dynamic";

/* =========================================================
   GET — Office Request Viewer
   - Fetches Request + Parts + Audit
========================================================= */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await supabaseServer();
  const { id: requestId } = await params;

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2. Load Request (Correct Table: service_requests)
  const { data: request, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      customer:customers ( id, name ),
      vehicle:vehicles ( year, make, model, plate, unit_number, vin ),
      tech:profiles!service_requests_technician_id_fkey ( id, full_name ),
      request_images ( id, url_full )
    `)
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!request) {
    return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, request });
}

/* =========================================================
   PATCH — Update Request (Status, Service Def, Notes, PO)
========================================================= */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await supabaseServer();
  const { id: requestId } = await params;

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // 👉 LOCK: Dispatch cannot modify service details
  const role = user.user_metadata?.role;
  if (role === "DISPATCH") {
    return NextResponse.json(
      { error: "Dispatch cannot modify service details" },
      { status: 403 }
    );
  }

  // 2. Parse Body
  const body = await req.json();

  // 🔴 VALIDATION: Check Status Transition
  // We must fetch the current status first to validate the transition
  const { data: currentRequest } = await supabase
    .from("service_requests")
    .select("status")
    .eq("id", requestId)
    .single();

  if (!currentRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const currentStatus = currentRequest.status;
  const nextStatus = body.status;

  if (nextStatus && nextStatus !== currentStatus) {
    if (!isValidTransition(currentStatus, nextStatus)) {
      return NextResponse.json(
        { error: `Invalid status transition: ${currentStatus} → ${nextStatus}` },
        { status: 400 }
      );
    }
  }

  // 3. Build Update Object (Only allow specific fields)
  const updates: any = {};

  // Status & Workflow
  if (body.status !== undefined) updates.status = body.status;
  
  // Service Definition
  if (body.service_title !== undefined) updates.service_title = body.service_title;
  if (body.service_description !== undefined) updates.service_description = body.service_description;

  // Office Fields (PO, Invoice, Notes)
  if (body.po !== undefined) updates.po = body.po;
  if (body.invoice_number !== undefined) updates.invoice_number = body.invoice_number;
  if (body.office_notes !== undefined) updates.office_notes = body.office_notes;

  // Completion Logic
  if (body.completed_at !== undefined) updates.completed_at = body.completed_at;
  if (body.completed_by_role !== undefined) updates.completed_by_role = body.completed_by_role;
  if (body.completion_note !== undefined) updates.completion_note = body.completion_note;

  // 4. Perform Update
  const { data, error } = await supabase
    .from("service_requests")
    .update(updates)
    .eq("id", requestId)
    .select()
    .single();

  if (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // 🔴 LOGGING: Log Status Change if successful
  if (nextStatus && nextStatus !== currentStatus) {
    await logActivity({
      request_id: requestId,
      actor_id: user.id,
      actor_role: "OFFICE",
      action: "STATUS_CHANGE",
      from_value: currentStatus,
      to_value: nextStatus,
    });
  }

  return NextResponse.json({ ok: true, request: data });
}