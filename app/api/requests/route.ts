// app/api/requests/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Resolve company_id for current user (profile-first, vehicles fallback)
async function resolveCompanyId() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id || null;

  if (uid) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", uid)
      .maybeSingle();
    if (prof?.company_id) return { supabase, company_id: prof.company_id as string };
  }

  const { data: v } = await supabase
    .from("vehicles")
    .select("company_id")
    .not("company_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { supabase, company_id: (v?.company_id as string) ?? null };
}

// ---------- GET: /api/requests?status=NEW|SCHEDULED|...
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;

    const { supabase, company_id } = await resolveCompanyId();
    if (!company_id) return NextResponse.json([]);

    let q = supabase
      .from("service_requests")
      .select(
        `
        id, status, created_at, service, po, notes,
        customer:customer_id ( name, market ),
        vehicle:vehicle_id ( year, make, model, plate, unit_number )
      `
      )
      .eq("company_id", company_id)
      .order("created_at", { ascending: false });

    if (status) q = q.eq("status", status);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data ?? []);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

// ---------- POST: /api/requests  (back-compatible + clear errors)
export async function POST(req: Request) {
  try {
    const { supabase, company_id } = await resolveCompanyId();
    if (!company_id) {
      return NextResponse.json({ error: "No company detected for user." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    // Accept both new & legacy field names
    const vehicle_id: string | null =
      body.vehicle_id ?? body.vehicle ?? body.vehicleId ?? null;
    const customer_id: string | null =
      body.customer_id ?? body.customer ?? body.customerId ?? null;
    const service: string | null = (body.service ?? "").trim() || null;

    // Optional extras
    const po: string | null = (body.po ?? "").trim() || null;
    const notes: string | null = (body.notes ?? "").trim() || null;
    const mileage = body.mileage ?? null;
    const fmc_id = body.fmc_id ?? body.fmc ?? null;

    // Detailed validation
    const missing: string[] = [];
    if (!vehicle_id) missing.push("vehicle_id");
    if (!customer_id) missing.push("customer_id");
    if (!service) missing.push("service");
    if (missing.length) {
      return NextResponse.json(
        { error: `Missing required field(s): ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Build insert payload
    const basePayload: Record<string, any> = {
      company_id,
      vehicle_id,
      customer_id,
      status: "NEW",
      service,
      po,
      notes,
    };
    if (mileage !== null && mileage !== undefined) basePayload.mileage = mileage;
    if (fmc_id) basePayload.fmc_id = fmc_id;

    // Insert w/ fallback minimal payload if optional columns fail
    const { data, error } = await supabase
      .from("service_requests")
      .insert(basePayload)
      .select("id")
      .maybeSingle();

    if (error) {
      const minimal = {
        company_id,
        vehicle_id,
        customer_id,
        status: "NEW",
        service,
        po,
        notes,
      };
      const retry = await supabase
        .from("service_requests")
        .insert(minimal)
        .select("id")
        .maybeSingle();

      if (retry.error) {
        return NextResponse.json({ error: retry.error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, id: retry.data?.id });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
