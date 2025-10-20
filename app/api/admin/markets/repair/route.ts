// app/api/admin/markets/repair/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/markets/repair
 * - Ensures core markets exist for the current ADMIN's company
 * - Clears orphaned company_customers.market references (markets that no longer exist)
 * Returns { created: number, cleared: number }
 */
export async function POST() {
  const { ok, company_id } = await requireRole(["ADMIN"]);
  if (!ok || !company_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await supabaseServer();

  // 1) Fetch existing markets for this company
  const { data: existing, error: exErr } = await supabase
    .from("company_locations")
    .select("id,name")
    .eq("company_id", company_id)
    .eq("location_type", "MARKET");

  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });

  const have = new Set((existing ?? []).map((m) => (m.name || "").trim()));
  const desired = ["San Antonio", "Dallas", "Washington", "NorCal"];
  const toCreate = desired.filter((n) => !have.has(n));

  let created = 0;

  // 2) Insert any missing markets
  if (toCreate.length) {
    const { error: insErr } = await supabase.from("company_locations").insert(
      toCreate.map((name) => ({
        company_id,
        name,
        location_type: "MARKET",
      })) as any[]
    );
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    created = toCreate.length;
  }

  // 3) Clear orphaned customer.market values (markets that no longer exist)
  //    We cannot do a NOT EXISTS subquery with joins in a single update via PostgREST,
  //    so we fetch valid market ids and null any market not in that set.
  const validIds = new Set<string>(
    ((existing ?? []).map((m) => m.id) as string[]).filter(Boolean)
  );

  // Also include newly created markets (we don't know ids here, but since
  // newly created markets aren't referenced yet, it's okay to proceed.)
  // The goal is to null out only *invalid* references.

  // Fetch customers with a market set for this company
  const { data: custs, error: cErr } = await supabase
    .from("company_customers")
    .select("id, market")
    .eq("company_id", company_id)
    .not("market", "is", null);

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  const toNull = (custs ?? [])
    .filter((c) => c.market && !validIds.has(c.market as string))
    .map((c) => c.id as string);

  let cleared = 0;
  if (toNull.length) {
    const { error: upErr } = await supabase
      .from("company_customers")
      .update({ market: null })
      .in("id", toNull)
      .eq("company_id", company_id);

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    cleared = toNull.length;
  }

  return NextResponse.json({ ok: true, created, cleared });
}
