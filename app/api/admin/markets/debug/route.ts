// app/api/admin/markets/debug/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveCompanyId() {
  const supabase = await supabaseServer();

  // Try profiles.company_id for current user
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

  // Fallback: newest vehicle with company_id
  const { data: v } = await supabase
    .from("vehicles")
    .select("company_id")
    .not("company_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { supabase, company_id: (v?.company_id as string) ?? null };
}

export async function GET() {
  try {
    const { supabase, company_id } = await resolveCompanyId();
    if (!company_id) {
      return NextResponse.json({ ok: false, error: "No company detected." }, { status: 400 });
    }

    const { data: markets, error: mErr } = await supabase
      .from("company_locations")
      .select("id,name,location_type")
      .eq("company_id", company_id)
      .order("name");

    const { data: customers, error: cErr } = await supabase
      .from("company_customers")
      .select("id,name,market")
      .eq("company_id", company_id)
      .order("name");

    if (mErr || cErr) {
      return NextResponse.json(
        { ok: false, error: mErr?.message || cErr?.message || "Query error" },
        { status: 500 }
      );
    }

    const marketIds = new Set((markets ?? []).filter(x => x.location_type === "MARKET").map(x => x.id));
    const assigned = (customers ?? []).filter(c => !!c.market);
    const unassigned = (customers ?? []).filter(c => !c.market);
    const orphaned = (customers ?? []).filter(c => c.market && !marketIds.has(c.market as string));

    return NextResponse.json({
      ok: true,
      company_id,
      counts: {
        markets_total: markets?.length ?? 0,
        markets_only: (markets ?? []).filter(x => x.location_type === "MARKET").length,
        sites_only: (markets ?? []).filter(x => x.location_type === "SITE").length,
        customers_total: customers?.length ?? 0,
        customers_assigned: assigned.length,
        customers_unassigned: unassigned.length,
        customers_orphaned: orphaned.length,
      },
      sample: {
        markets: (markets ?? []).slice(0, 5),
        customers_unassigned: unassigned.slice(0, 5),
        customers_orphaned: orphaned.slice(0, 5),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
