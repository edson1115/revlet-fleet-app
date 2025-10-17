// app/api/dev/seed/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Resolve a company_id using: profiles → user_metadata → latest vehicle → latest location/customer
async function resolveCompanyId() {
  const supabase = await supabaseServer();

  // profiles.company_id
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id || null;
    if (uid) {
      const { data: prof, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", uid)
        .maybeSingle();
      if (!error && prof?.company_id) return { company_id: prof.company_id as string, via: "profiles.company_id" };
    }
  } catch {}

  // user_metadata.company_id
  try {
    const supa = await supabaseServer();
    const { data: auth } = await supa.auth.getUser();
    const cid = (auth.user?.user_metadata as any)?.company_id ?? null;
    if (cid) return { company_id: cid as string, via: "user_metadata.company_id" };
  } catch {}

  // latest vehicles.company_id
  try {
    const { data: v } = await supabase
      .from("vehicles")
      .select("company_id")
      .not("company_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (v?.company_id) return { company_id: v.company_id as string, via: "vehicles.latest.company_id" };
  } catch {}

  // any locations.company_id
  try {
    const { data: l } = await supabase
      .from("locations")
      .select("company_id")
      .not("company_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (l?.company_id) return { company_id: l.company_id as string, via: "locations.any.company_id" };
  } catch {}

  // any customers.company_id
  try {
    const { data: c } = await supabase
      .from("customers")
      .select("company_id")
      .not("company_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (c?.company_id) return { company_id: c.company_id as string, via: "customers.any.company_id" };
  } catch {}

  return { company_id: null as string | null, via: "none" };
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const json = await req.json().catch(() => ({} as any));
  const explicitCompanyId: string | undefined = json?.company_id;

  const { company_id: resolved, via } = await resolveCompanyId();
  const company_id = explicitCompanyId ?? resolved ?? null;

  if (!company_id) {
    return NextResponse.json(
      { ok: false, reason: "no-company", message: "Could not resolve company_id. Pass {company_id} in body." },
      { status: 400 }
    );
  }

  // Upsert one Location + one Customer for this company (if missing)
  let seeded = { location: false, customer: false };

  // locations
  let { data: locs } = await supabase
    .from("locations")
    .select("id, name")
    .eq("company_id", company_id)
    .limit(1);
  if (!locs || locs.length === 0) {
    const { error: insL } = await supabase
      .from("locations")
      .insert([{ company_id, name: "Main Depot" }]);
    if (!insL) seeded.location = true;
  }

  // customers
  let { data: custs } = await supabase
    .from("customers")
    .select("id, name")
    .eq("company_id", company_id)
    .limit(1);
  if (!custs || custs.length === 0) {
    const { error: insC } = await supabase
      .from("customers")
      .insert([{ company_id, name: "Demo Customer" }]);
    if (!insC) seeded.customer = true;
  }

  // return what we see now
  const { data: outLocs } = await supabase
    .from("locations")
    .select("id, name")
    .eq("company_id", company_id)
    .order("name", { ascending: true });

  const { data: outCusts } = await supabase
    .from("customers")
    .select("id, name")
    .eq("company_id", company_id)
    .order("name", { ascending: true });

  return NextResponse.json({
    ok: true,
    used_company_id: company_id,
    resolved_via: explicitCompanyId ? "explicit" : via,
    seeded,
    locations: outLocs ?? [],
    customers: outCusts ?? [],
  });
}

export async function GET() {
  // GET will seed using resolved company_id (no body)
  return POST(new Request("http://local/dev-seed", { method: "POST", body: "{}" }));
}
