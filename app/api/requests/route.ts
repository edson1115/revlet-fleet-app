// app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Super-admin allow list */
function isSuperAdminEmail(email?: string | null) {
  const envList = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const fallback = "edson.cortes@bigo.com";
  const e = (email || "").toLowerCase();
  return !!e && (envList.includes(e) || e === fallback);
}

function pickScheduled(r: any) {
  // Only use scheduled_at to match your schema
  return r.scheduled_at ?? null;
}

function toUiRow(
  r: any,
  rel: {
    customers: Record<string, any>;
    vehicles: Record<string, any>;
    locations: Record<string, any>;
    technicians: Record<string, any>;
  }
) {
  const customer = r.customer_id ? rel.customers[r.customer_id] ?? null : null;
  const vehicle = r.vehicle_id ? rel.vehicles[r.vehicle_id] ?? null : null;
  const location = r.location_id ? rel.locations[r.location_id] ?? null : null;
  const tech = r.technician_id ? rel.technicians[r.technician_id] ?? null : null;

  return {
    id: r.id,
    status: r.status ?? "NEW",
    service: r.service ?? null,
    po: r.po ?? null,
    notes: r.notes ?? null,
    mileage: r.mileage ?? null,
    priority: r.priority ?? null,
    created_at: r.created_at,
    scheduled_at: pickScheduled(r),
    customer: customer
      ? {
          id: customer.id,
          name: customer.name ?? customer.company_name ?? null,
        }
      : null,
    vehicle: vehicle
      ? {
          id: vehicle.id,
          year: vehicle.year ?? null,
          make: vehicle.make ?? null,
          model: vehicle.model ?? null,
          plate: vehicle.plate ?? null,
          unit_number: vehicle.unit_number ?? null,
        }
      : null,
    location: location ? { id: location.id, name: location.name ?? null } : null,
    technician: tech ? { id: tech.id ?? null } : null,
  };
}

async function fetchRelations(
  supabase: any,
  ids: {
    customerIds: string[];
    vehicleIds: string[];
    locationIds: string[];
    technicianIds: string[];
  },
  scope: { company_id: string | null; isAdmin: boolean }
) {
  const { company_id, isAdmin } = scope;

  async function load(
    table: "company_customers" | "vehicles" | "company_locations" | "technicians",
    columns: string,
    idList: string[]
  ) {
    if (idList.length === 0) return {};
    let q = supabase.from(table).select(columns).in("id", idList);
    if (!isAdmin && company_id && table !== "technicians") q = q.eq("company_id", company_id);
    const { data } = await q;
    const map: Record<string, any> = {};
    (data ?? []).forEach((row: any) => (map[row.id] = row));
    return map;
  }

  const [customers, vehicles, locations, technicians] = await Promise.all([
    load("company_customers", "id, name, company_id", ids.customerIds),
    load("vehicles", "id, year, make, model, plate, unit_number, company_id", ids.vehicleIds),
    load("company_locations", "id, name, company_id", ids.locationIds),
    load("technicians", "id, name, company_id", ids.technicianIds),
  ]);

  return { customers, vehicles, locations, technicians };
}

/** GET /api/requests (list) */
export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const url = new URL(req.url);

    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 500);
    const sortByParam = (url.searchParams.get("sortBy") || "created_at").toLowerCase();
    const sortDirAsc = (url.searchParams.get("sortDir") || "desc").toLowerCase() === "asc";
    const mine = url.searchParams.get("mine") === "1";
    const statusFilter = url.searchParams.get("status") || undefined;

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id || null;
    const email = auth?.user?.email || null;
    if (!uid) return NextResponse.json({ rows: [] });

    const { data: prof } = await supabase
      .from("profiles")
      .select("company_id, customer_id, role")
      .eq("id", uid)
      .maybeSingle();

    const meta = (auth?.user?.user_metadata ?? {}) as Record<string, any>;
    const role = (prof?.role ?? meta?.role ?? (isSuperAdminEmail(email) ? "ADMIN" : null)) as string | null;
    const isAdmin = String(role || "").toUpperCase() === "ADMIN" || isSuperAdminEmail(email);
    const company_id = prof?.company_id ?? meta?.company_id ?? null;
    const customer_id = prof?.customer_id ?? meta?.customer_id ?? null;

    // Select only columns we know exist (no schedule_dt/scheduled_for)
    const cols = [
      "id",
      "status",
      "service",
      "po",
      "notes",
      "mileage",
      "priority",
      "created_at",
      "scheduled_at",
      "company_id",
      "customer_id",
      "vehicle_id",
      "location_id",
      "technician_id",
    ].join(",");

    let q = supabase.from("service_requests").select(cols);

    if (!isAdmin && company_id) q = q.eq("company_id", company_id);
    if (mine) {
      if (!customer_id) return NextResponse.json({ rows: [] });
      q = q.eq("customer_id", customer_id);
    }
    if (statusFilter) q = q.eq("status", statusFilter);

    if (sortByParam === "scheduled_at") {
      q = q.order("scheduled_at", { ascending: sortDirAsc }).limit(limit);
    } else {
      q = q.order("created_at", { ascending: sortDirAsc }).limit(limit);
    }

    const { data, error } = await q;
    if (error) return NextResponse.json({ rows: [] });

    const rows = data ?? [];

    const customerIds = Array.from(new Set(rows.map((r: any) => r.customer_id).filter(Boolean)));
    const vehicleIds = Array.from(new Set(rows.map((r: any) => r.vehicle_id).filter(Boolean)));
    const locationIds = Array.from(new Set(rows.map((r: any) => r.location_id).filter(Boolean)));
    const technicianIds = Array.from(new Set(rows.map((r: any) => r.technician_id).filter(Boolean)));

    const rel = await fetchRelations(
      supabase,
      { customerIds, vehicleIds, locationIds, technicianIds },
      { company_id, isAdmin }
    );

    let out = rows.map((r: any) => toUiRow(r, rel));

    if (sortByParam === "scheduled_at") {
      out = out.sort((a, b) => {
        const as = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
        const bs = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
        return sortDirAsc ? as - bs : bs - as;
      });
    }

    return NextResponse.json({ rows: out.slice(0, limit) });
  } catch {
    return NextResponse.json({ rows: [] });
  }
}

/** POST /api/requests (create) */
export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const body = await req.json().catch(() => ({} as any));

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id || null;
    const email = auth?.user?.email || null;
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { data: prof } = await supabase
      .from("profiles")
      .select("company_id, customer_id, role")
      .eq("id", uid)
      .maybeSingle();

    const meta = (auth?.user?.user_metadata ?? {}) as Record<string, any>;
    const role = (prof?.role ?? meta?.role ?? (isSuperAdminEmail(email) ? "ADMIN" : null)) as string | null;
    const isAdmin = String(role || "").toUpperCase() === "ADMIN" || isSuperAdminEmail(email);
    const company_id = prof?.company_id ?? meta?.company_id ?? null;

    const {
      customer_id = null,
      location_id = null,
      vehicle_id = null,
      vehicle = undefined as undefined | {
        unit_number?: string | null;
        year?: number | null;
        make?: string | null;
        model?: string | null;
        plate?: string | null;
        vin?: string | null;
      },
      service = null,
      notes = null,
      po = null,
      mileage = null,
      priority = null as null | string,
      scheduled_at = null as null | string,
    } = body || {};

    // Ensure vehicle_id if inline vehicle data was sent
    let finalVehicleId: string | null = vehicle_id ?? null;
    if (!finalVehicleId && vehicle && (vehicle.unit_number || vehicle.plate || vehicle.vin)) {
      const unit = (vehicle.unit_number || "").trim();
      if (unit) {
        let res = await supabase
          .from("vehicles")
          .upsert(
            [
              {
                company_id: company_id ?? null,
                unit_number: unit,
                year: vehicle.year ?? null,
                make: vehicle.make ?? null,
                model: vehicle.model ?? null,
                plate: vehicle.plate ?? null,
                vin: vehicle.vin ?? null,
              },
            ],
            company_id ? { onConflict: "company_id,unit_number" } : undefined
          )
          .select("id")
          .single();

        if (res.error) {
          // Fallback find by unit_number (+ company_id if available)
          let q = supabase.from("vehicles").select("id").eq("unit_number", unit).limit(1).maybeSingle();
          if (company_id) q = q.eq("company_id", company_id);
          const alt = await q;
          if (!alt.error && alt.data?.id) finalVehicleId = alt.data.id;
        } else {
          finalVehicleId = res.data?.id ?? null;
        }
      }
    }

    // Build insert row (only columns that exist)
    const insertRow: any = {
      status: "NEW",
      service,
      notes,
      po,
      mileage,
      priority,
      customer_id,
      location_id,
      vehicle_id: finalVehicleId,
    };
    if (company_id) insertRow.company_id = company_id;
    if (scheduled_at) insertRow.scheduled_at = new Date(scheduled_at).toISOString();

    const ins = await supabase
      .from("service_requests")
      .insert(insertRow)
      .select(
        "id, status, service, po, notes, mileage, priority, created_at, scheduled_at, customer_id, vehicle_id, location_id, technician_id"
      )
      .single();

    if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });

    const r = ins.data;
    const rel = await fetchRelations(
      supabase,
      {
        customerIds: r.customer_id ? [r.customer_id] : [],
        vehicleIds: r.vehicle_id ? [r.vehicle_id] : [],
        locationIds: r.location_id ? [r.location_id] : [],
        technicianIds: r.technician_id ? [r.technician_id] : [],
      },
      { company_id, isAdmin }
    );

    return NextResponse.json(toUiRow(r, rel), { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "create_failed" }, { status: 500 });
  }
}
