// app/api/requests/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function resolveCompanyId() {
  const supabase = await supabaseServer();
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id || null;
    if (uid) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", uid)
        .maybeSingle();
      if (prof?.company_id) return prof.company_id as string;
    }
  } catch {}
  try {
    const { data: v } = await supabase
      .from("vehicles")
      .select("company_id")
      .not("company_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (v?.company_id) return v.company_id as string;
  } catch {}
  return null;
}

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? "100");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const sortBy = (url.searchParams.get("sortBy") ?? "created_at") as "created_at" | "status" | "scheduled_at";
  const sortDir = (url.searchParams.get("sortDir") ?? "desc") as "asc" | "desc";
  const mine = url.searchParams.get("mine") === "1";
  const techId = url.searchParams.get("techId") || undefined;

  const company_id = await resolveCompanyId();
  if (!company_id) {
    // Graceful empty
    return NextResponse.json({ rows: [], total: 0 });
  }

  // Base select
  let q = supabase
    .from("service_requests")
    .select(
      `
      id, company_id, status, created_at, scheduled_at, started_at, completed_at,
      service, fmc, mileage, po, notes, priority,
      vehicle:vehicle_id ( id, year, make, model, plate, unit_number ),
      customer:customer_id ( id, name ),
      location:location_id ( id, name ),
      technician:technician_id ( id )
    `,
      { count: "exact" }
    )
    .eq("company_id", company_id)
    .order(sortBy, { ascending: sortDir === "asc" })
    .range(offset, offset + limit - 1);

  if (status) q = q.eq("status", status);
  if (techId) q = q.eq("technician_id", techId);

  // Customer's own view (mine=1)
  if (mine) {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id || null;

    // If not signed in → return empty (no 401)
    if (!uid) {
      return NextResponse.json({ rows: [], total: 0 });
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", uid)
      .maybeSingle();

    // If the profile is not bound to a customer, empty
    if (!prof?.customer_id) {
      return NextResponse.json({ rows: [], total: 0 });
    }

    q = q.eq("customer_id", prof.customer_id as string);
  }

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ rows: [], total: 0, error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [], total: count ?? 0 });
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  if (!company_id) return NextResponse.json({ error: "No company." }, { status: 400 });

  const raw = await req.json().catch(() => ({} as any));
  const vehicle_id = raw.vehicle_id;
  const location_id = raw.location_id;
  const customer_id = raw.customer_id;

  const service = raw.service ?? raw.service_type;
  const fmc = raw.fmc ?? null;
  const mileage = raw.mileage ?? raw.odometer_miles ?? null;
  const po = raw.po ?? raw.po_number ?? null;
  const notes = (raw.notes ?? raw.customer_notes) ?? null;
  const priority = raw.priority ?? null;
  const status = raw.status ?? "NEW";

  // Require sign-in for creation (customer or office). You can relax this if you want anonymous capture.
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  if (!vehicle_id || !location_id || !customer_id || !service) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const insertRow: Record<string, any> = {
    company_id,
    vehicle_id,
    location_id,
    customer_id,
    service,
    fmc,
    mileage,
    po,
    notes,
    priority,
    status,
  };

  if (raw.scheduled_at) insertRow.scheduled_at = new Date(raw.scheduled_at).toISOString();
  if (status === "SCHEDULED" && !insertRow.scheduled_at) insertRow.scheduled_at = new Date().toISOString();
  if (status === "IN_PROGRESS") insertRow.started_at = new Date().toISOString();
  if (status === "COMPLETED") insertRow.completed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("service_requests")
    .insert([insertRow])
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data?.id });
}
