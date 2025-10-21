// app/api/vehicles/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveCompanyId() {
  const supabase = await supabaseServer();

  // 1) from profile
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

  // 2) fallback: last vehicle with company_id
  const { data: v } = await supabase
    .from("vehicles")
    .select("company_id")
    .not("company_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { supabase, company_id: (v?.company_id as string) ?? null };
}

// GET /api/vehicles -> { vehicles: [...] }
export async function GET() {
  try {
    const { supabase, company_id } = await resolveCompanyId();
    if (!company_id) return NextResponse.json({ vehicles: [] });

    const { data, error } = await supabase
      .from("vehicles")
      .select("id, year, make, model, plate, unit_number")
      .eq("company_id", company_id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ vehicles: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

// POST /api/vehicles -> create a vehicle
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { supabase, company_id } = await resolveCompanyId();
    if (!company_id) return NextResponse.json({ error: "No company" }, { status: 400 });

    const payload = {
      company_id,
      year: body.year ?? null,
      make: body.make ?? null,
      model: body.model ?? null,
      plate: body.plate ?? null,
      unit_number: body.unit_number ?? null,
    };

    const { data, error } = await supabase.from("vehicles").insert(payload).select("id").maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
