// app/api/requests/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { DB_TO_UI_STATUS, UI_TO_DB_STATUS, type UiStatus } from "@/lib/status";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// since fmc is an enum & NOT NULL, we always write this
const FMC_ENUM_FALLBACK = "NONE";

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
  return r.scheduled_at ?? null; // only use scheduled_at
}

function toUiStatus(dbVal?: string | null): UiStatus | string {
  if (!dbVal) return "NEW";
  return DB_TO_UI_STATUS[dbVal] ?? dbVal;
}

function toDbStatus(input?: string | null): string | null {
  if (!input) return null;
  const u = String(input).trim().toUpperCase() as UiStatus;
  return UI_TO_DB_STATUS[u] ?? input; // passthrough if already DB style
}

function toUiRow(
  r: any,
  rel: {
    customers: Record<string, any>;
    vehicles: Record<string, any>;
    locations: Record<string, any>;
    technicians: Record<string, any>;
  },
  notes?: Array<{ id: string; text: string; created_at?: string | null }> | null
) {
  const customer = r.customer_id ? rel.customers[r.customer_id] ?? null : null;
  const vehicle = r.vehicle_id ? rel.vehicles[r.vehicle_id] ?? null : null;
  const location = r.location_id ? rel.locations[r.location_id] ?? null : null;
  const tech = r.technician_id ? rel.technicians[r.technician_id] ?? null : null;

  // prefer text → fallback to enum → fallback to null
  const fmc = r.fmc_text ?? r.fmc ?? null;

  return {
    id: r.id,
    status: toUiStatus(r.status),
    service: r.service ?? null,
    fmc,
    po: r.po ?? null,
    notes: r.notes ?? null,
    mileage: r.mileage ?? null,
    priority: r.priority ?? null,
    created_at: r.created_at,
    scheduled_at: pickScheduled(r),
    customer: customer ? { id: customer.id, name: customer.name ?? customer.company_name ?? null } : null,
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
    notes_list: notes ?? null,
  };
}

async function fetchRelations(
  supabase: any,
  ids: {
    customerId?: string | null;
    vehicleId?: string | null;
    locationId?: string | null;
    technicianId?: string | null;
  },
  scope: { company_id: string | null; isAdmin: boolean }
) {
  const { company_id, isAdmin } = scope;

  async function loadOne(
    table: "company_customers" | "vehicles" | "company_locations" | "technicians",
    columns: string,
    id?: string | null
  ) {
    if (!id) return null;
    let q = supabase.from(table).select(columns).eq("id", id).limit(1).maybeSingle();
    if (!isAdmin && company_id && table !== "technicians") q = q.eq("company_id", company_id);
    const { data } = await q;
    return data ?? null;
  }

  const [customer, vehicle, location, technician] = await Promise.all([
    loadOne("company_customers", "id, name, company_id", ids.customerId),
    loadOne("vehicles", "id, year, make, model, plate, unit_number, company_id", ids.vehicleId),
    loadOne("company_locations", "id, name, company_id", ids.locationId),
    loadOne("technicians", "id, name, company_id", ids.technicianId),
  ]);

  return {
    customers: customer ? { [customer.id]: customer } : {},
    vehicles: vehicle ? { [vehicle.id]: vehicle } : {},
    locations: location ? { [location.id]: location } : {},
    technicians: technician ? { [technician.id]: technician } : {},
  };
}

async function fetchNotesIfAny(supabase: any, requestId: string) {
  try {
    const { data, error } = await supabase
      .from("service_request_notes")
      .select("id, text, created_at")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });
    if (error) return null;
    return (data ?? []).map((n: any) => ({
      id: n.id,
      text: n.text ?? "",
      created_at: n.created_at ?? null,
    }));
  } catch {
    return null;
  }
}

/** GET /api/requests/[id] */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const supabase = await supabaseServer();

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id || null;
    const email = auth?.user?.email || null;
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { data: prof } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", uid)
      .maybeSingle();

    const meta = (auth?.user?.user_metadata ?? {}) as Record<string, any>;
    const role = (prof?.role ?? meta?.role ?? (isSuperAdminEmail(email) ? "ADMIN" : null)) as string | null;
    const isAdmin = String(role || "").toUpperCase() === "ADMIN" || isSuperAdminEmail(email);
    const company_id = prof?.company_id ?? meta?.company_id ?? null;

    // IMPORTANT: include fmc_text here
    const cols = [
      "id",
      "status",
      "service",
      "fmc",
      "fmc_text",
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

    let q = supabase.from("service_requests").select(cols).eq("id", id).limit(1).maybeSingle();
    if (!isAdmin && company_id) q = q.eq("company_id", company_id);

    const { data: row, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const rel = await fetchRelations(
      supabase,
      {
        customerId: row.customer_id,
        vehicleId: row.vehicle_id,
        locationId: row.location_id,
        technicianId: row.technician_id,
      },
      { company_id, isAdmin }
    );

    const notes = await fetchNotesIfAny(supabase, row.id);

    return NextResponse.json(toUiRow(row, rel, notes));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

/** PATCH /api/requests/[id] */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const supabase = await supabaseServer();
    const body = await req.json().catch(() => ({} as any));

    const {
      status = undefined,
      service = undefined,
      fmc = undefined,
      po = undefined,
      notes = undefined,
      mileage = undefined,
      priority = undefined,
      scheduled_at = undefined,
      add_note = undefined as string | undefined,
      remove_note_id = undefined as string | undefined,
    } = body || {};

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id || null;
    const email = auth?.user?.email || null;
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { data: prof } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", uid)
      .maybeSingle();

    const meta = (auth?.user?.user_metadata ?? {}) as Record<string, any>;
    const role = (prof?.role ?? meta?.role ?? (isSuperAdminEmail(email) ? "ADMIN" : null)) as string | null;
    const isAdmin = String(role || "").toUpperCase() === "ADMIN" || isSuperAdminEmail(email);
    const company_id = prof?.company_id ?? meta?.company_id ?? null;

    // build patch
    const patch: any = {};
    if (typeof status !== "undefined") patch.status = status ? toDbStatus(status) : null;
    if (typeof service !== "undefined") patch.service = service || null;
    if (typeof fmc !== "undefined") {
      // always keep enum happy
      patch.fmc = FMC_ENUM_FALLBACK;
      // store user-typed text
      patch.fmc_text = fmc || null;
    }
    if (typeof po !== "undefined") patch.po = po || null;
    if (typeof notes !== "undefined") patch.notes = notes || null;
    if (typeof mileage !== "undefined") patch.mileage = mileage === "" ? null : Number(mileage);
    if (typeof priority !== "undefined") patch.priority = priority || null;
    if (typeof scheduled_at !== "undefined") {
      patch.scheduled_at = scheduled_at ? new Date(scheduled_at).toISOString() : null;
    }

    if (Object.keys(patch).length > 0) {
      let uq = supabase.from("service_requests").update(patch).eq("id", id).select("id").maybeSingle();
      if (!isAdmin && company_id) uq = uq.eq("company_id", company_id);
      const ures = await uq;
      if (ures.error) return NextResponse.json({ error: ures.error.message }, { status: 500 });
    }

    // add note
    if (add_note && add_note.trim()) {
      try {
        await supabase.from("service_request_notes").insert([{ request_id: id, text: add_note.trim() }]);
      } catch {
        // ignore
      }
    }

    // remove note
    if (remove_note_id) {
      try {
        await supabase.from("service_request_notes").delete().eq("id", remove_note_id).eq("request_id", id);
      } catch {
        // ignore
      }
    }

    // return fresh
    const cols = [
      "id",
      "status",
      "service",
      "fmc",
      "fmc_text",
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

    let q = supabase.from("service_requests").select(cols).eq("id", id).limit(1).maybeSingle();
    if (!isAdmin && company_id) q = q.eq("company_id", company_id);
    const { data: row, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const rel = await fetchRelations(
      supabase,
      {
        customerId: row.customer_id,
        vehicleId: row.vehicle_id,
        locationId: row.location_id,
        technicianId: row.technician_id,
      },
      { company_id, isAdmin }
    );
    const notesList = await fetchNotesIfAny(supabase, row.id);

    // map status back to UI
    row.status = toUiStatus(row.status);

    return NextResponse.json(toUiRow(row, rel, notesList));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "update_failed" }, { status: 500 });
  }
}
