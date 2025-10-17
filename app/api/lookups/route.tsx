// app/api/lookups/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function resolveCompanyId() {
  const supabase = await supabaseServer();

  // Preferred: profiles.company_id (for the signed-in user)
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

  // Fallback: infer from a recent vehicle
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
  const scope = (url.searchParams.get("scope") || "locations").toLowerCase();

  // --- FMC options (global) ---
  if (scope === "fmc") {
    const { data, error } = await supabase
      .from("fmc_options")
      .select("id,label")
      .order("sort_order", { ascending: true })
      .order("label", { ascending: true });

    if (error) {
      return NextResponse.json({ rows: [], error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      rows: (data ?? []).map((d) => ({ id: d.id, label: d.label })),
      via: "fmc_options",
    });
  }

  // --- Company-scoped lookups ---
  const company_id = await resolveCompanyId();
  if (!company_id) return NextResponse.json({ rows: [], error: "no_company" }, { status: 400 });

  // LOCATIONS => return only MARKETS; if zero, fall back to SITES (so UI isn't empty)
  if (scope === "locations") {
    // Try MARKETS first
    const markets = await supabase
      .from("company_locations")
      .select("id, name")
      .eq("company_id", company_id)
      .eq("location_type", "MARKET")
      .order("name", { ascending: true });

    if (!markets.error && (markets.data?.length ?? 0) > 0) {
      return NextResponse.json({ rows: markets.data ?? [], via: "MARKET" });
    }

    // Fallback: SITES
    const sites = await supabase
      .from("company_locations")
      .select("id, name")
      .eq("company_id", company_id)
      .eq("location_type", "SITE")
      .order("name", { ascending: true });

    if (sites.error) {
      return NextResponse.json({ rows: [], error: sites.error.message }, { status: 500 });
    }
    return NextResponse.json({ rows: sites.data ?? [], via: "SITE" });
  }

  // CUSTOMERS => optional ?market=MarketName filter
  if (scope === "customers") {
    const market = url.searchParams.get("market") || "";
    let q = supabase
      .from("company_customers")
      .select("id, name, market")
      .eq("company_id", company_id)
      .order("name", { ascending: true });

    if (market) q = q.eq("market", market);

    const { data, error } = await q;
    if (error) {
      return NextResponse.json({ rows: [], error: error.message }, { status: 500 });
    }
    return NextResponse.json({ rows: data ?? [], via: market ? `customers:${market}` : "customers" });
  }

  return NextResponse.json({ rows: [] });
}
