// app/api/requests/[id]/route.ts
import { supabaseServer } from "@/lib/supabase/server";

// Extract request ID safely
function getId(url: string) {
  const parts = new URL(url).pathname.split("/");
  return parts[parts.length - 1];
}

export async function GET(req: Request) {
  const id = getId(req.url);
  const supabase = await supabaseServer();

  // ----------------------------------------------
  // LOAD REQUEST CORE
  // ----------------------------------------------
  const { data: request, error: errReq } = await supabase
    .from("service_requests")
    .select(
      `
        id,
        vehicle_id,
        customer_id,
        technician_id,
        service,
        notes,
        internal_notes,
        dispatch_notes,
        status,
        date_requested,
        created_at,
        scheduled_start_at,
        scheduled_end_at,
        started_at,
        completed_at,

        vehicle:vehicle_id (
          id,
          year, make, model, plate, vin, unit_number,
          notes_internal
        ),

        assigned_tech:technician_id (
          id,
          full_name,
          role
        ),

        customer:customer_id (
          id,
          name,
          approval_type,
          address
        )
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (errReq || !request) {
    return new Response(JSON.stringify({ error: "Request not found" }), {
      status: 404,
    });
  }

  // ----------------------------------------------
  // LOAD IMAGES
  // ----------------------------------------------
  const { data: images } = await supabase
    .from("request_images")
    .select("id, url_full, url_thumb, type, created_at")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  // ----------------------------------------------
  // LOAD PARTS
  // ----------------------------------------------
  const { data: parts } = await supabase
    .from("request_parts")
    .select("id, name, qty")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  return new Response(
    JSON.stringify({
      request: { ...request, images: images || [] },
      parts: parts || [],
    }),
    { status: 200 }
  );
}

// --------------------------------------------------------------
// PATCH — ACTION CONTROLLER
// --------------------------------------------------------------
export async function PATCH(req: Request) {
  const id = getId(req.url);
  const body = await req.json();
  const { action, ...payload } = body;

  const supabase = await supabaseServer();

  // Helper to update request safely
  async function update(values: Record<string, any>) {
    return await supabase
      .from("service_requests")
      .update(values)
      .eq("id", id)
      .select()
      .maybeSingle();
  }

  // ------------------------------------------------------------
  // 0. UPDATE REQUEST FIELDS (Office page)
  // ------------------------------------------------------------
  if (action === "update_request_fields") {
    const {
      fmc,
      po,
      notes,
      priority,
      mileage,
      preferred_window_start,
      preferred_window_end,
    } = payload;

    const updateValues: any = {
      fmc: fmc ?? null,
      po_number: po ?? null,
      notes: notes ?? null,
      priority: priority ?? null,
      mileage: mileage ?? null,
      preferred_window_start: preferred_window_start ?? null,
      preferred_window_end: preferred_window_end ?? null,
    };

    const { data, error } = await update(updateValues);

    if (error) return respError(error.message);
    return respOk(data);
  }

  // ------------------------------------------------------------
  // 1. START JOB
  // ------------------------------------------------------------
  if (action === "start_job") {
    const { data, error } = await update({
      status: "IN_PROGRESS",
      started_at: new Date().toISOString(),
    });

    if (error) return respError(error.message);
    return respOk(data);
  }

  // ------------------------------------------------------------
  // 2. COMPLETE JOB
  // ------------------------------------------------------------
  if (action === "complete_job") {
    const { data, error } = await update({
      status: "COMPLETED",
      completed_at: new Date().toISOString(),
    });

    if (error) return respError(error.message);
    return respOk(data);
  }

  // ------------------------------------------------------------
  // 3. UPDATE NOTES (internal or dispatch)
  // ------------------------------------------------------------
  if (action === "update_notes") {
    const { internal_notes, dispatch_notes } = payload;

    const { data, error } = await update({
      ...(internal_notes !== undefined && { internal_notes }),
      ...(dispatch_notes !== undefined && { dispatch_notes }),
    });

    if (error) return respError(error.message);
    return respOk(data);
  }

  // ------------------------------------------------------------
  // 4. RESCHEDULE JOB
  // ------------------------------------------------------------
  if (action === "reschedule") {
    const { start, end, technician_id } = payload;

    const { data, error } = await update({
      scheduled_start_at: start,
      scheduled_end_at: end,
      ...(technician_id && { technician_id }),
      status: "SCHEDULED",
    });

    if (error) return respError(error.message);
    return respOk(data);
  }

  // ------------------------------------------------------------
  // 5. ASSIGN TECH
  // ------------------------------------------------------------
  if (action === "assign_tech") {
    const { technician_id } = payload;

    const { data, error } = await update({
      technician_id,
    });

    if (error) return respError(error.message);
    return respOk(data);
  }

  // ------------------------------------------------------------
  // 6. SEND BACK TO DISPATCH
  // ------------------------------------------------------------
  if (action === "send_back") {
    const { dispatch_notes } = payload;

    const { data, error } = await update({
      status: "WAITING_TO_BE_SCHEDULED",
      dispatch_notes: dispatch_notes || "Returned by technician",
    });

    if (error) return respError(error.message);
    return respOk(data);
  }

  // ------------------------------------------------------------
  // UNKNOWN ACTION
  // ------------------------------------------------------------
  return respError("Invalid action", 400);
}

// --------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------
function respOk(data: any) {
  return new Response(JSON.stringify({ ok: true, data }), { status: 200 });
}

function respError(message: string, status = 500) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
  });
}
