// app/api/vehicles/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

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

const SELECT_COLS =
  "id, company_id, customer_id, unit_number, plate, year, make, model, vin, created_at";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  const customer_id = url.searchParams.get("customer_id") || undefined;

  const company_id = await resolveCompanyId();
  if (!company_id) {
    return NextResponse.json(
      debug
        ? { error: "no_company", hint: "profiles.company_id is null for this user" }
        : { error: "no_company" },
      { status: 400 }
    );
  }

  try {
    if (!customer_id) {
      let res = await supabase.from("vehicles").select(SELECT_COLS).eq("company_id", company_id);
      if (res.error) res = await supabase.from("vehicles").select("*").eq("company_id", company_id);
      if (res.error) throw res.error;
      return NextResponse.json(res.data ?? []);
    }

    // Try direct column first
    let direct = await supabase
      .from("vehicles")
      .select(SELECT_COLS)
      .eq("company_id", company_id)
      .eq("customer_id", customer_id);
    if (direct.error) {
      direct = await supabase
        .from("vehicles")
        .select("*")
        .eq("company_id", company_id)
        .eq("customer_id", customer_id);
    }
    if (!direct.error && (direct.data?.length ?? 0) > 0) {
      return NextResponse.json(direct.data ?? []);
    }

    // Fallback: join table
    const join = await supabase
      .from("company_customer_vehicles")
      .select("vehicle_id")
      .eq("company_id", company_id)
      .eq("customer_id", customer_id);

    if (!join.error && (join.data?.length ?? 0) > 0) {
      const ids = (join.data ?? []).map((r: { vehicle_id: string }) => r.vehicle_id);
      let byIds = await supabase
        .from("vehicles")
        .select(SELECT_COLS)
        .eq("company_id", company_id)
        .in("id", ids);
      if (byIds.error) {
        byIds = await supabase
          .from("vehicles")
          .select("*")
          .eq("company_id", company_id)
          .in("id", ids);
      }
      if (byIds.error) throw byIds.error;
      return NextResponse.json(byIds.data ?? []);
    }

    if (debug) {
      let unsafe = await supabase.from("vehicles").select(SELECT_COLS).eq("customer_id", customer_id);
      if (unsafe.error) unsafe = await supabase.from("vehicles").select("*").eq("customer_id", customer_id);
      return NextResponse.json({
        rows: [],
        via: "empty_for_company",
        probe_found_for_other_company: Array.isArray(unsafe.data) ? unsafe.data.length : undefined,
        probe_sample: Array.isArray(unsafe.data) ? unsafe.data.slice(0, 3) : [],
      });
    }

    return NextResponse.json([]);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  if (!company_id) {
    return NextResponse.json({ error: "no_company" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    customer_id,
    unit_number,
    plate = null,
    year = null,
    make = null,
    model = null,
    vin = null,
  } = body ?? {};

  if (!customer_id || !unit_number?.trim()) {
    return NextResponse.json({ error: "customer_id and unit_number are required" }, { status: 400 });
  }

  const cleanUnit = String(unit_number).trim();

  try {
    // First attempt: schema WITH vehicles.customer_id — use UPSERT to avoid unique errors
    let upsert = await supabase
      .from("vehicles")
      .upsert(
        [{ company_id, customer_id, unit_number: cleanUnit, plate, year, make, model, vin }],
        { onConflict: "company_id,unit_number" }
      )
      .select(SELECT_COLS)
      .single();

    if (!upsert.error) {
      return NextResponse.json(upsert.data, { status: 201 });
    }

    // If that failed because there is no customer_id column, do a 2-step UPSERT + link
    // Step 1: upsert the vehicle row without customer_id
    let veh = await supabase
      .from("vehicles")
      .upsert(
        [{ company_id, unit_number: cleanUnit, plate, year, make, model, vin }],
        { onConflict: "company_id,unit_number" }
      )
      .select("id, company_id, unit_number, plate, year, make, model, vin, created_at")
      .single();

    if (veh.error) {
      // If it's still a unique violation, fetch the existing and proceed
      // @ts-ignore - Supabase error has details but not typed
      const code = (veh as any).error?.code || (veh as any).error?.details;
      if (code === "23505" || String(veh.error.message || "").includes("duplicate")) {
        const existing = await supabase
          .from("vehicles")
          .select("id, company_id, unit_number, plate, year, make, model, vin, created_at")
          .eq("company_id", company_id)
          .eq("unit_number", cleanUnit)
          .maybeSingle();
        if (!existing.error && existing.data) veh = existing as any;
        else throw veh.error;
      } else {
        throw veh.error;
      }
    }

    const vehicle_id = veh.data!.id as string;

    // Step 2: ensure link (company_customer_vehicles), idempotent
    try {
      await supabase
        .from("company_customer_vehicles")
        .upsert(
          [{ company_id, customer_id, vehicle_id }],
          { onConflict: "company_id,customer_id,vehicle_id" }
        )
        .select("vehicle_id")
        .single();
    } catch {
      // ignore linking errors (table may not exist)
    }

    return NextResponse.json(veh.data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
