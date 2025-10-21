// app/api/vehicles/route.ts
import { NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/supabase/server";

async function resolveCompanyId() {
  const supabase = await supabaseRoute();
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
  return null;
}

export async function GET(req: Request) {
  const supabase = await supabaseRoute();
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  const customer_id = url.searchParams.get("customer_id");

  const company_id = await resolveCompanyId();
  if (!company_id) {
    return NextResponse.json(
      debug ? { error: "no_company", hint: "profiles.company_id is null for this user" } : { error: "no_company" },
      { status: 400 }
    );
  }

  // Helper to select columns safely (fallback to * if mismatch)
  const selectCols = "id, company_id, customer_id, unit_number, plate, year, make, model, vin, created_at";

  try {
    if (!customer_id) {
      // List all vehicles in company (no order to avoid missing-column errors)
      let res = await supabase.from("vehicles").select(selectCols).eq("company_id", company_id);
      if (res.error) res = await supabase.from("vehicles").select("*").eq("company_id", company_id);
      if (res.error) throw res.error;
      return NextResponse.json(res.data ?? []);
    }

    // 1) Try vehicles.customer_id directly
    let direct = await supabase
      .from("vehicles")
      .select(selectCols)
      .eq("company_id", company_id)
      .eq("customer_id", customer_id);

    if (direct.error) {
      // fallback to * (schema differences)
      direct = await supabase
        .from("vehicles")
        .select("*")
        .eq("company_id", company_id)
        .eq("customer_id", customer_id);
    }

    if (!direct.error && (direct.data?.length ?? 0) > 0) {
      return NextResponse.json(direct.data ?? []);
    }

    // 2) Try join table company_customer_vehicles
    const join = await supabase
      .from("company_customer_vehicles")
      .select("vehicle_id")
      .eq("company_id", company_id)
      .eq("customer_id", customer_id);

    if (!join.error && (join.data?.length ?? 0) > 0) {
      const ids = (join.data ?? []).map((r: { vehicle_id: string }) => r.vehicle_id);
      let byIds = await supabase.from("vehicles").select(selectCols).eq("company_id", company_id).in("id", ids);
      if (byIds.error) byIds = await supabase.from("vehicles").select("*").eq("company_id", company_id).in("id", ids);
      if (byIds.error) throw byIds.error;
      return NextResponse.json(byIds.data ?? []);
    }

    // 3) DEBUG ONLY: probe without company filter to detect company mismatch
    if (debug) {
      let unsafe = await supabase.from("vehicles").select(selectCols).eq("customer_id", customer_id);
      if (unsafe.error) unsafe = await supabase.from("vehicles").select("*").eq("customer_id", customer_id);
      return NextResponse.json({
        rows: [],
        via: "empty_for_company",
        probe_found_for_other_company: Array.isArray(unsafe.data) ? unsafe.data.length : undefined,
        probe_sample: Array.isArray(unsafe.data) ? unsafe.data.slice(0, 3) : [],
        hint: "If probe shows rows, those vehicles have a different company_id than your profile.",
      });
    }

    // Nothing found
    return NextResponse.json([]);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabase = await supabaseRoute();
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";

  const company_id = await resolveCompanyId();
  if (!company_id) {
    return NextResponse.json(
      debug ? { error: "no_company", hint: "profiles.company_id is null for this user" } : { error: "no_company" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const {
    customer_id,
    unit_number = null,
    plate = null,
    year = null,
    make = null,
    model = null,
    vin = null,
  } = body ?? {};

  if (!customer_id) {
    return NextResponse.json({ error: "customer_id required" }, { status: 400 });
  }

  try {
    // Try insert with customer_id column on vehicles
    let ins = await supabase
      .from("vehicles")
      .insert([{ company_id, customer_id, unit_number, plate, year, make, model, vin }])
      .select("id, company_id, customer_id, unit_number, plate, year, make, model, vin, created_at")
      .single();

    if (ins.error) {
      // Fallback: insert without customer_id, then link via join table
      ins = await supabase
        .from("vehicles")
        .insert([{ company_id, unit_number, plate, year, make, model, vin }])
        .select("id, company_id, unit_number, plate, year, make, model, vin, created_at")
        .single();

      if (ins.error) throw ins.error;

      // Best effort link (ignore if join table missing)
      await supabase
        .from("company_customer_vehicles")
        .insert([{ company_id, customer_id, vehicle_id: ins.data.id }])
        .select("vehicle_id")
        .single()
        .catch(() => null);
    }

    return NextResponse.json(ins.data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
