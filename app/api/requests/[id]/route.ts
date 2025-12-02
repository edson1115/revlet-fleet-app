// app/api/requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: any
) {
  const supabase = supabaseServer();
  const scope = await resolveUserScope();
  const id = params.id;

  if (!scope.uid) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  let query = supabase
    .from("service_requests")
    .select(
      `
      id,
      status,
      service,
      notes,
      dispatch_notes,
      mileage,
      po,
      created_at,
      scheduled_at,
      scheduled_end_at,
      customer:customers(name, id),
      location:locations(name, id),
      vehicle:vehicles(*),
      technician:profiles(full_name, id),
      preferred_window_start,
      preferred_window_end
    `
    )
    .eq("id", id)
    .maybeSingle();

  // SCOPING
  if (scope.isTech) {
    query = query.eq("technician_id", scope.uid);
  }

  if (scope.isCustomer) {
    query = query.eq("customer_id", scope.customer_id);
  }

  const { data, error } = await query;

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: "Request not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, request: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: any
) {
  const id = params.id;
  const supabase = supabaseServer();
  const scope = await resolveUserScope();

  if (!scope.uid) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();

  let update: any = {};

  // Allowed updates based on role

  if (scope.isTech) {
    if (body.status === "IN_PROGRESS") update.status = "IN_PROGRESS";
    if (body.status === "COMPLETED") update.status = "COMPLETED";
    if (typeof body.mileage === "number") update.mileage = body.mileage;
  }

  if (scope.isInternal) {
    if (body.status) update.status = body.status;
    if (body.technician_id) update.technician_id = body.technician_id;
    if (body.scheduled_at) update.scheduled_at = body.scheduled_at;
    if (body.scheduled_end_at) update.scheduled_end_at = body.scheduled_end_at;
    if (body.notes) update.notes = body.notes;
    if (body.dispatch_notes) update.dispatch_notes = body.dispatch_notes;
    if (body.po) update.po = body.po;
    if (body.mileage) update.mileage = body.mileage;
  }

  if (scope.isCustomer) {
    return NextResponse.json(
      { ok: false, error: "Customers cannot modify requests" },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("service_requests")
    .update(update)
    .eq("id", id);

  if (error) {
    console.error("PATCH update error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
