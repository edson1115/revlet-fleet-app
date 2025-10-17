// app/api/requests/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function resolveCompanyId() {
  const supabase = await supabaseServer();
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id || null;
    if (uid) {
      const { data: prof, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", uid)
        .maybeSingle();
      if (!error && prof?.company_id) return prof.company_id as string;
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

  const company_id = await resolveCompanyId();
  if (!company_id) return NextResponse.json({ rows: [] });

  let q = supabase
    .from("service_requests")
    .select(
      `
      id, company_id, status, created_at, scheduled_at, started_at, completed_at,
      service, fmc, mileage, po, notes,
      vehicle:vehicle_id ( id, year, make, model, plate, unit_number ),
      customer:customer_id ( id, name ),
      location:location_id ( id, name )
    `
    )
    .eq("company_id", company_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ rows: [], error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  if (!company_id) return NextResponse.json({ error: "No company." }, { status: 400 });

  const body = await req.json();
  const {
    vehicle_id,
    location_id,
    customer_id,
    service,
    fmc = null,
    mileage = null,
    po = null,
    notes = null,
    status = "NEW", // allow bypass to COMPLETED from office if desired
  } = body ?? {};

  if (!vehicle_id || !location_id || !customer_id || !service) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("service_requests")
    .insert([
      {
        company_id,
        vehicle_id,
        location_id,
        customer_id,
        service,
        fmc,
        mileage,
        po,
        notes,
        status,
        ...(status === "SCHEDULED" ? { scheduled_at: new Date().toISOString() } : {}),
        ...(status === "IN_PROGRESS" ? { started_at: new Date().toISOString() } : {}),
        ...(status === "COMPLETED" ? { completed_at: new Date().toISOString() } : {}),
      },
    ])
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data?.id });
}
