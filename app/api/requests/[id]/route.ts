// app/api/requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import { DB_TO_UI_STATUS, UI_TO_DB_STATUS } from "@/lib/status";

export const dynamic = "force-dynamic";

/* --------------------------------------------------------
   Status helpers
--------------------------------------------------------- */
function toUiStatus(dbVal?: string | null): string {
  return DB_TO_UI_STATUS[dbVal ?? ""] ?? dbVal ?? "NEW";
}

function toDbStatus(uiVal?: string | null): string | null {
  if (!uiVal) return null;
  return UI_TO_DB_STATUS[uiVal.toUpperCase()] ?? uiVal;
}

/* --------------------------------------------------------
   Allowed transitions by role
--------------------------------------------------------- */

const OFFICE_ALLOWED = new Set([
  "WAITING_APPROVAL",
  "WAITING_PARTS",
  "COMPLETED",
]);

const DISPATCH_ALLOWED = new Set([
  "SCHEDULED",
  "IN_PROGRESS",
  "RESCHEDULED",
]);

const TECH_ALLOWED = new Set([
  "IN_PROGRESS",
  "COMPLETED",
  "RESCHEDULED",
]);

function isTransitionAllowed(role: string, newStatus: string) {
  switch (role) {
    case "OFFICE":
      return OFFICE_ALLOWED.has(newStatus);
    case "DISPATCH":
      return DISPATCH_ALLOWED.has(newStatus);
    case "TECH":
      return TECH_ALLOWED.has(newStatus);
    case "ADMIN":
    case "SUPERADMIN":
      return true;
    default:
      return false;
  }
}

/* --------------------------------------------------------
   Load one request with relations
--------------------------------------------------------- */
async function fetchOne(supabase: any, id: string) {
  return supabase
    .from("service_requests")
    .select(
      `
      id,
      status,
      service,
      notes,
      dispatch_notes,
      mileage,
      priority,
      po,
      fmc_text,
      company_id,
      location_id,
      customer_id,
      vehicle_id,
      technician_id,
      source,
      created_at,
      scheduled_at,
      completed_at,

      customer:customers(id, name, market),
      vehicle:vehicles(id, year, make, model, plate, unit_number),
      location:locations(id, name, market),
      tech:profiles(id, full_name)
    `
    )
    .eq("id", id)
    .maybeSingle();
}

/* --------------------------------------------------------
   GET /api/requests/[id]
--------------------------------------------------------- */
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await supabaseServer();
  const scope = await resolveUserScope();

  if (!scope.uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await fetchOne(supabase, id);

  if (error || !data) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  /* Enforce market/company/customer access manually */
  const requestMarket = data.customer?.market || data.location?.market || null;

  if (scope.isSuper) {
    // always allow
  } else if (scope.isCustomer) {
    if (data.customer_id !== scope.customer_id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  } else if (scope.isTech) {
    if (data.technician_id !== scope.uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  } else if (scope.isInternal) {
    if (!scope.markets.includes(requestMarket)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: data.id,
    status: toUiStatus(data.status),
    service: data.service,
    notes: data.notes,
    dispatch_notes: data.dispatch_notes,
    mileage: data.mileage,
    priority: data.priority,
    po: data.po,
    fmc: data.fmc_text,
    company_id: data.company_id,
    created_at: data.created_at,
    scheduled_at: data.scheduled_at,
    completed_at: data.completed_at,
    source: data.source,

    customer: data.customer,
    vehicle: data.vehicle,
    location: data.location,
    technician: data.tech,
  });
}

/* --------------------------------------------------------
   PATCH /api/requests/[id]
--------------------------------------------------------- */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await supabaseServer();
  const scope = await resolveUserScope();

  if (!scope.uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const newStatus = body.status ? toDbStatus(body.status) : null;

  const { data: existing, error: existingErr } = await fetchOne(supabase, id);
  if (existingErr || !existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  /* ----- Enforce role + market + company access ----- */
  const reqMarket = existing.customer?.market || existing.location?.market;

  if (scope.isSuper) {
    // always allowed
  }
  else if (scope.isCustomer) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  else if (scope.isTech) {
    if (existing.technician_id !== scope.uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }
  else if (scope.isInternal) {
    if (!scope.markets.includes(reqMarket)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }
  else {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  /* ----- Validate status transitions ----- */
  if (newStatus) {
    const role = scope.role;

    if (!isTransitionAllowed(role, newStatus)) {
      return NextResponse.json(
        {
          error: "status_not_allowed",
          role,
          attempted: newStatus,
        },
        { status: 403 }
      );
    }
  }

  /* ----- Prepare update ----- */
  const update: any = {};

  if (newStatus) update.status = newStatus;
  if (body.notes !== undefined) update.notes = body.notes;
  if (body.dispatch_notes !== undefined) update.dispatch_notes = body.dispatch_notes;
  if (body.po !== undefined) update.po = body.po;
  if (body.priority !== undefined) update.priority = body.priority;
  if (body.mileage !== undefined) update.mileage = Number(body.mileage) || null;
  if (body.technician_id !== undefined) update.technician_id = body.technician_id;
  if (body.scheduled_at !== undefined) update.scheduled_at = body.scheduled_at;

  /* ----- Save ----- */
  const { data: updated, error } = await supabase
    .from("service_requests")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    id: updated.id,
    status: toUiStatus(updated.status),
    service: updated.service,
    notes: updated.notes,
    dispatch_notes: updated.dispatch_notes,
    mileage: updated.mileage,
    priority: updated.priority,
    po: updated.po,
    scheduled_at: updated.scheduled_at,
    completed_at: updated.completed_at,
  });
}
