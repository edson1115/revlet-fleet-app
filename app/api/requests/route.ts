// app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  DB_TO_UI_STATUS,
  UI_TO_DB_STATUS,
  type UiStatus,
} from "@/lib/status";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// match DB enum default you actually have ("NONE" etc)
const FMC_ENUM_FALLBACK = "NONE";

/** Super-admin allow list */
function isSuperAdminEmail(email?: string | null) {
  const envList = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const fallback = "edson.cortes@bigo.com"; // keep your override
  const e = (email || "").toLowerCase();
  return !!e && (envList.includes(e) || e === fallback);
}

function pickScheduled(r: any) {
  return r.scheduled_at ?? null;
}

function toUiStatus(dbVal?: string | null): UiStatus | string {
  if (!dbVal) return "NEW";
  return DB_TO_UI_STATUS[dbVal] ?? dbVal;
}

function toDbStatus(input?: string | null): string | null {
  if (!input) return null;
  const u = String(input).trim().toUpperCase() as UiStatus;
  return UI_TO_DB_STATUS[u] ?? input;
}

type RelMaps = {
  customers: Record<string, any>;
  vehicles: Record<string, any>;
  locations: Record<string, any>;
  technicians: Record<string, any>;
};

function toUiRow(r: any, rel: RelMaps) {
  const customer = r.customer_id
    ? rel.customers[r.customer_id] ?? null
    : null;
  const vehicle = r.vehicle_id
    ? rel.vehicles[r.vehicle_id] ?? null
    : null;
  const location = r.location_id
    ? rel.locations[r.location_id] ?? null
    : null;
  const tech = r.technician_id
    ? rel.technicians[r.technician_id] ?? null
    : null;

  const fmc = r.fmc_text ?? r.fmc ?? null;

  return {
    id: r.id,
    status: toUiStatus(r.status),
    service: r.service ?? null,
    fmc,
    po: r.po ?? null,
    notes: r.notes ?? null,
    dispatch_notes: r.dispatch_notes ?? null,
    mileage: r.mileage ?? null,
    priority: r.priority ?? null,
    created_at: r.created_at,
    scheduled_at: pickScheduled(r),
    customer: customer
      ? {
          id: customer.id,
          name: customer.name ?? null,
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
    location: location
      ? { id: location.id, name: location.name ?? null }
      : null,
    technician: tech
      ? { id: tech.id ?? null, name: tech.name ?? null }
      : null,
  };
}

async function loadRelations(
  supabase: any,
  rows: any[],
  scope: { company_id: string | null; isAdmin: boolean }
): Promise<RelMaps> {
  const { company_id, isAdmin } = scope;

  const customerIds = Array.from(
    new Set(
      rows
        .map((r) => r.customer_id)
        .filter(Boolean)
    )
  );
  const vehicleIds = Array.from(
    new Set(
      rows
        .map((r) => r.vehicle_id)
        .filter(Boolean)
    )
  );
  const locationIds = Array.from(
    new Set(
      rows
        .map((r) => r.location_id)
        .filter(Boolean)
    )
  );
  const techIds = Array.from(
    new Set(
      rows
        .map((r) => r.technician_id)
        .filter(Boolean)
    )
  );

  const customers: Record<string, any> = {};
  const vehicles: Record<string, any> = {};
  const locations: Record<string, any> = {};
  const technicians: Record<string, any> = {};

  if (customerIds.length) {
    let q = supabase
      .from("company_customers")
      .select("id, name, company_id")
      .in("id", customerIds);
    if (!isAdmin && company_id) {
      q = q.eq("company_id", company_id);
    }
    const { data } = await q;
    (data || []).forEach((c: any) => {
      customers[c.id] = c;
    });
  }

  if (vehicleIds.length) {
    let q = supabase
      .from("vehicles")
      .select(
        "id, year, make, model, plate, unit_number, company_id"
      )
      .in("id", vehicleIds);
    if (!isAdmin && company_id) {
      q = q.eq("company_id", company_id);
    }
    const { data } = await q;
    (data || []).forEach((v: any) => {
      vehicles[v.id] = v;
    });
  }

  if (locationIds.length) {
    let q = supabase
      .from("company_locations")
      .select("id, name, company_id")
      .in("id", locationIds);
    if (!isAdmin && company_id) {
      q = q.eq("company_id", company_id);
    }
    const { data } = await q;
    (data || []).forEach((l: any) => {
      locations[l.id] = l;
    });
  }

  if (techIds.length) {
    let q = supabase
      .from("technicians")
      .select("id, name, company_id")
      .in("id", techIds);
    // usually techs are already company-scoped; keep same pattern
    if (!isAdmin && company_id) {
      q = q.eq("company_id", company_id);
    }
    const { data } = await q;
    (data || []).forEach((t: any) => {
      technicians[t.id] = t;
    });
  }

  return { customers, vehicles, locations, technicians };
}

/* ========================
   GET /api/requests
   Used by Office, Dispatch, Tech
   ======================== */
export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id || null;
    const email = auth?.user?.email || null;

    if (!uid) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 }
      );
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", uid)
      .maybeSingle();

    const meta =
      (auth?.user?.user_metadata ??
        {}) as Record<string, any>;
    const role =
      (prof?.role ??
        meta?.role ??
        (isSuperAdminEmail(email) ? "ADMIN" : null)) || null;

    const isAdmin =
      String(role || "").toUpperCase() === "ADMIN" ||
      String(role || "").toUpperCase() === "SUPERADMIN" ||
      isSuperAdminEmail(email);
    const company_id =
      prof?.company_id ?? meta?.company_id ?? null;

    const url = new URL(req.url);
    const statusCsv = url.searchParams.get("status");
    const technicianId =
      url.searchParams.get("technician_id") || null;
    const customerId =
      url.searchParams.get("customer_id") || null;
    const locationId =
      url.searchParams.get("location_id") || null;
    const limit =
      Number(url.searchParams.get("limit") || "100") || 100;
    const sortBy =
      url.searchParams.get("sortBy") || "created_at";
    const sortDir =
      (url.searchParams.get("sortDir") || "desc").toLowerCase() ===
      "asc"
        ? "asc"
        : "desc";

    const cols = [
      "id",
      "status",
      "service",
      "fmc",
      "fmc_text",
      "po",
      "notes",
      "dispatch_notes",
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

    let q = supabase
      .from("service_requests")
      .select(cols)
      .order(sortBy, {
        ascending: sortDir === "asc",
      })
      .limit(limit);

    if (!isAdmin && company_id) {
      q = q.eq("company_id", company_id);
    }

    if (technicianId) {
      q = q.eq("technician_id", technicianId);
    }
    if (customerId) {
      q = q.eq("customer_id", customerId);
    }
    if (locationId) {
      q = q.eq("location_id", locationId);
    }

    if (statusCsv) {
      const wanted = statusCsv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (wanted.length) {
        // convert UI statuses to DB statuses
        const dbStatuses = wanted.map(
          (s) => toDbStatus(s) || s
        );
        q = q.in("status", dbStatuses);
      }
    }

    const { data, error } = await q;
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const rows = data || [];
    if (!rows.length) {
      return NextResponse.json({ rows: [] });
    }

    const rel = await loadRelations(
      supabase,
      rows,
      { company_id, isAdmin }
    );
    const uiRows = rows.map((r: any) =>
      toUiRow(r, rel)
    );

    return NextResponse.json({ rows: uiRows });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "failed" },
      { status: 500 }
    );
  }
}

/* ========================
   POST /api/requests
   Create a new service request
   Used by: Customer, Office, Admin, Superadmin
   ======================== */
export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id || null;
    const email = auth?.user?.email || null;

    if (!uid) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 }
      );
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("company_id, role, customer_id")
      .eq("id", uid)
      .maybeSingle();

    const meta = (auth?.user?.user_metadata ?? {}) as Record<
      string,
      any
    >;

    const roleRaw =
      prof?.role ??
      meta?.role ??
      (isSuperAdminEmail(email) ? "SUPERADMIN" : null);

    const role = String(roleRaw || "").toUpperCase();
    const isAdmin =
      role === "ADMIN" ||
      role === "SUPERADMIN" ||
      isSuperAdminEmail(email);

    const company_id =
      prof?.company_id ?? meta?.company_id ?? null;
    const sessionCustomerId =
      prof?.customer_id ?? meta?.customer_id ?? null;

    const body = await req.json().catch(() => ({} as any));
    const {
      op,
      customer_id,
      location_id,
      vehicle_id,
      new_vehicle,
      service,
      notes,
      po,
      mileage,
      fmc,
    } = body || {};

    // This endpoint is only for single create
    if (op && op !== "create_request") {
      return NextResponse.json(
        { error: "unsupported_op" },
        { status: 400 }
      );
    }

    if (!service || typeof service !== "string") {
      return NextResponse.json(
        { error: "service_required" },
        { status: 400 }
      );
    }

    // ----- Resolve effective customer / location / vehicle -----
    let effectiveCustomerId = customer_id || null;
    let effectiveLocationId = location_id || null;
    let effectiveVehicleId = vehicle_id || null;

    // CUSTOMER: locked to their own account
    if (role === "CUSTOMER") {
      if (!sessionCustomerId) {
        return NextResponse.json(
          { error: "no_customer_bound_to_account" },
          { status: 400 }
        );
      }
      effectiveCustomerId = sessionCustomerId;
    }

    // OPTIONAL: use new_vehicle.id if supplied (we're not creating vehicles here)
    if (!effectiveVehicleId && new_vehicle?.id) {
      effectiveVehicleId = new_vehicle.id;
    }

    // OFFICE/DISPATCH/ADMIN/SUPERADMIN must specify location
    if (!effectiveLocationId) {
      return NextResponse.json(
        { error: "location_required" },
        { status: 400 }
      );
    }

    // Company is required so RLS passes
    if (!company_id && !isAdmin) {
      return NextResponse.json(
        { error: "company_context_required" },
        { status: 400 }
      );
    }

    const initialStatus = "NEW";

    // fmc is NOT NULL in DB → always set something
    const rawFmc =
      fmc !== undefined && fmc !== null && String(fmc).trim() !== ""
        ? String(fmc).trim()
        : null;

    const insert: any = {
      company_id: company_id || null,
      customer_id: effectiveCustomerId,
      location_id: effectiveLocationId,
      vehicle_id: effectiveVehicleId,
      service,
      status: toDbStatus(initialStatus) || initialStatus,
      // main notes from form
      notes: notes || null,
      // ✅ persist PO
      po: po ? String(po) : null,
      // ✅ persist mileage
      mileage:
        mileage === undefined ||
        mileage === null ||
        mileage === ""
          ? null
          : Number(mileage),
      // ✅ satisfy NOT NULL fmc
      fmc: FMC_ENUM_FALLBACK,
      fmc_text: rawFmc,
    };

    const { data, error } = await supabase
      .from("service_requests")
      .insert(insert)
      .select(
        "id, status, service, fmc, fmc_text, po, notes, dispatch_notes, mileage, priority, created_at, scheduled_at, company_id, customer_id, vehicle_id, location_id, technician_id"
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Reuse existing relation loader + mapper so Office/Dispatch see full info
    const rel = await loadRelations(supabase, [data], {
      company_id,
      isAdmin,
    });

    const ui = toUiRow(data, rel);
    return NextResponse.json(ui, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      {
        error:
          e?.message || "failed_to_create_request",
      },
      { status: 500 }
    );
  }
}

