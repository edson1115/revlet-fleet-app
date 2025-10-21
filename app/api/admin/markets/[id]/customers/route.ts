// app/api/admin/markets/[id]/customers/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper: read market id from URL path (no reliance on Next params)
function getMarketIdFromUrl(req: Request) {
  const { pathname } = new URL(req.url);
  // /api/admin/markets/:id/customers
  const parts = pathname.split("/").filter(Boolean);
  // ["api","admin","markets",":id","customers"]
  const id = parts[3];
  return id ?? "";
}

export async function GET(req: Request) {
  const id = getMarketIdFromUrl(req);

  const { ok, company_id } = await requireRole(["ADMIN"]);
  if (!ok || !company_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = await supabaseServer();

  // Verify market belongs to company & is MARKET
  const { data: market, error: mErr } = await supabase
    .from("company_locations")
    .select("id")
    .eq("id", id)
    .eq("company_id", company_id)
    .eq("location_type", "MARKET")
    .maybeSingle();

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });
  if (!market) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: all, error } = await supabase
    .from("company_customers")
    .select("id,name,market")
    .eq("company_id", company_id)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const assigned = (all ?? []).filter((c) => c.market === id);
  const unassigned = (all ?? []).filter((c) => !c.market || c.market !== id);

  return NextResponse.json({
    assigned: assigned.map(({ id, name }) => ({ id, name })),
    unassigned: unassigned.map(({ id, name }) => ({ id, name })),
  });
}

export async function POST(req: Request) {
  const id = getMarketIdFromUrl(req);

  const { ok, company_id } = await requireRole(["ADMIN"]);
  if (!ok || !company_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body?.customer_ids) ? body.customer_ids : [];

  const supabase = await supabaseServer();

  // Clear prior assignments for this market
  const { error: clearErr } = await supabase
    .from("company_customers")
    .update({ market: null })
    .eq("company_id", company_id)
    .eq("market", id);

  if (clearErr) return NextResponse.json({ error: clearErr.message }, { status: 500 });

  if (ids.length) {
    const { error: assignErr } = await supabase
      .from("company_customers")
      .update({ market: id })
      .in("id", ids)
      .eq("company_id", company_id);

    if (assignErr) return NextResponse.json({ error: assignErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
