// app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import { DB_TO_UI_STATUS, UI_TO_DB_STATUS } from "@/lib/status";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ============================================================
    Helpers
============================================================ */

function toUiStatus(dbVal?: string | null): string {
  if (!dbVal) return "NEW";
  return DB_TO_UI_STATUS[dbVal] ?? dbVal;
}

function toDbStatus(uiVal?: string | null): string | null {
  if (!uiVal) return null;
  const u = uiVal.toUpperCase().trim();
  return UI_TO_DB_STATUS[u] ?? u;
}

type RelMaps = {
  customers: Record<string, any>;
  vehicles: Record<string, any>;
  locations: Record<string, any>;
  technicians: Record<string, any>;
};

async function loadRelations(supabase: any, rows: any[]): Promise<RelMaps> {
  const customerIds = [...new Set(rows.map(r => r.customer_id).filter(Boolean))];
  const vehicleIds  = [...new Set(rows.map(r => r.vehicle_id).filter(Boolean))];
  const locationIds = [...new Set(rows.map(r => r.location_id).filter(Boolean))];
  const techIds     = [...new Set(rows.map(r => r.technician_id).filter(Boolean))];

  const customers: any = {};
  const vehicles: any = {};
  const locations: any = {};
  const technicians: any = {};

  if (customerIds.length) {
    const { data } = await supabase
      .from("customers")
      .select("id, name, market")
      .in("id", customerIds);
    (data || []).forEach((c) => (customers[c.id] = c));
  }

  if (vehicleIds.length) {
    const { data } = await supabase
      .from("vehicles")
      .select("id, year, make, model, plate, unit_number, customer_id")
      .in("id", vehicleIds);
    (data || []).forEach((v) => (vehicles[v.id] = v));
  }

  if (locationIds.length) {
    const { data } = await supabase
      .from("locations")
      .select("id, name, market")
      .in("id", locationIds);
    (data || []).forEach((l) => (locations[l.id] = l));
  }

  if (techIds.length) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("id", techIds);
    (data || []).forEach((t) => (technicians[t.id] = t));
  }

  return { customers, vehicles, locations, technicians };
}

function toUiRow(r: any, rel: RelMaps) {
  return {
    id: r.id,
    status: toUiStatus(r.status),
    service: r.service,
    fmc: r.fmc_text || null,
    po: r.po,
    notes: r.notes,
    dispatch_notes: r.dispatch_notes,
    mileage: r.mileage,
    priority: r.priority,
    created_at: r.created_at,
    scheduled_at: r.scheduled_at,
    completed_at: r.completed_at,
    company_id: r.company_id,
    source: r.source,

    customer: r.customer_id
      ? rel.customers[r.customer_id]
        ? { id: r.customer_id, name: rel.customers[r.customer_id].name }
        : null
      : null,

    vehicle: r.vehicle_id
      ? rel.vehicles[r.vehicle_id]
        ? {
            id: r.vehicle_id,
            year: rel.vehicles[r.vehicle_id].year,
            make: rel.vehicles[r.vehicle_id].make,
            model: rel.vehicles[r.vehicle_id].model,
            plate: rel.vehicles[r.vehicle_id].plate,
            unit_number: rel.vehicles[r.vehicle_id].unit_number,
          }
        : null
      : null,

    location: r.location_id
      ? rel.locations[r.location_id]
        ? { id: r.location_id, name: rel.locations[r.location_id].name }
        : null
      : null,

    technician: r.technician_id
      ? rel.technicians[r.technician_id]
        ? {
            id: r.technician_id,
            name: rel.technicians[r.technician_id].full_name,
          }
        : null
      : null,
  };
}

/* ============================================================
    GET /api/requests
============================================================ */
export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    if (!scope.uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const statusCsv = url.searchParams.get("status");
    const techId = url.searchParams.get("technician_id");
    const customerId = url.searchParams.get("customer_id");
    const limit = Number(url.searchParams.get("limit") || "200");

    let q = supabase
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Math.min(limit, 2000));

    /* --------------------------
        Role scoping (RLS safe)
    --------------------------- */

    if (scope.isSuper) {
      // no filters
    }
    else if (scope.isCustomer) {
      q = q.eq("customer_id", scope.customer_id);
    }
    else if (scope.isTech) {
      q = q.eq("technician_id", scope.uid);
    }
    else if (scope.isInternal) {
      if (scope.markets.length) {
        q = q.in("market", scope.markets);
      } else {
        return NextResponse.json({ rows: [] });
      }
    }
    else {
      return NextResponse.json({ rows: [] });
    }

    /* Client filters */
    if (techId) q = q.eq("technician_id", techId);
    if (customerId) q = q.eq("customer_id", customerId);

    if (statusCsv) {
      const dbStatuses = statusCsv
        .split(",")
        .map((s) => toDbStatus(s) || s);
      q = q.in("status", dbStatuses);
    }

    const { data, error } = await q;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (!data?.length) return NextResponse.json({ rows: [] });

    const rel = await loadRelations(supabase, data);
    const rows = data.map((r: any) => toUiRow(r, rel));

    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

/* ============================================================
    POST /api/requests — Create Request
============================================================ */
export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    if (!scope.uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    let {
      service,
      notes,
      po,
      mileage,
      customer_id,
      location_id,
      vehicle_id,
      source,
      fmc,
    } = body;

    if (!service) {
      return NextResponse.json({ error: "service_required" }, { status: 400 });
    }

    /* --------------------------------------
        Customer Portal must bind to own ID
    --------------------------------------- */
    if (scope.isCustomer) {
      customer_id = scope.customer_id;
    }

    /* --------------------------------------
        Internal roles must specify location
    --------------------------------------- */
    if (scope.isInternal && !location_id) {
      return NextResponse.json(
        { error: "location_required" },
        { status: 400 }
      );
    }

    const dbInsert = {
      company_id: scope.company_id,
      customer_id,
      location_id,
      vehicle_id,
      service,
      status: "NEW",
      notes: notes || null,
      dispatch_notes: null,
      po: po || null,
      mileage: mileage ? Number(mileage) : null,
      fmc_text: fmc || null,
      source: source || (scope.isCustomer ? "CUSTOMER_PORTAL" : "INTERNAL"),
    };

    const { data, error } = await supabase
      .from("service_requests")
      .insert(dbInsert)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rel = await loadRelations(supabase, [data]);

    return NextResponse.json(toUiRow(data, rel), { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
