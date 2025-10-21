// app/api/lookups/route.ts
import { NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function resolveCompanyId() {
  const supabase = await supabaseRoute();

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

// quick check for uuid-ish
function looksLikeUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export async function GET(req: Request) {
  const supabase = await supabaseRoute();
  const url = new URL(req.url);
  const scope = (url.searchParams.get("scope") || "locations").toLowerCase();
  const flat = url.searchParams.get("flat") === "1";

  // --- FMC options (global) ---
  if (scope === "fmc") {
    const { data, error } = await supabase
      .from("fmc_options")
      .select("id,label")
      .order("sort_order", { ascending: true })
      .order("label", { ascending: true });

    if (error) {
      const payload = { rows: [], error: error.message };
      return NextResponse.json(flat ? [] : payload, { status: 500 });
    }

    const rows = (data ?? []).map((d) => ({ id: d.id, label: d.label }));
    return NextResponse.json(flat ? rows : { rows, via: "fmc_options" });
  }

  // --- Company-scoped lookups ---
  const company_id = await resolveCompanyId();
  if (!company_id) {
    const payload = { rows: [], error: "no_company" };
    return NextResponse.json(flat ? [] : payload, { status: 400 });
  }

  // LOCATIONS => return only MARKETS; if zero, fall back to SITES
  if (scope === "locations") {
    // Try MARKETS first
    const markets = await supabase
      .from("company_locations")
      .select("id, name")
      .eq("company_id", company_id)
      .eq("location_type", "MARKET")
      .order("name", { ascending: true });

    if (!markets.error && (markets.data?.length ?? 0) > 0) {
      const rows = markets.data ?? [];
      return NextResponse.json(flat ? rows : { rows, via: "MARKET" });
    }

    // Fallback: SITES
    const sites = await supabase
      .from("company_locations")
      .select("id, name")
      .eq("company_id", company_id)
      .eq("location_type", "SITE")
      .order("name", { ascending: true });

    if (sites.error) {
      const payload = { rows: [], error: sites.error.message };
      return NextResponse.json(flat ? [] : payload, { status: 500 });
    }
    const rows = sites.data ?? [];
    return NextResponse.json(flat ? rows : { rows, via: "SITE" });
  }

  // CUSTOMERS => optional ?market=<id or name> filter
  if (scope === "customers") {
    const marketParam = url.searchParams.get("market") || "";

    // If no market provided, return all company customers
    if (!marketParam) {
      const { data, error } = await supabase
        .from("company_customers")
        .select("id, name, market")
        .eq("company_id", company_id)
        .order("name", { ascending: true });

      if (error) {
        const payload = { rows: [], error: error.message };
        return NextResponse.json(flat ? [] : payload, { status: 500 });
      }
      const rows = data ?? [];
      return NextResponse.json(flat ? rows : { rows, via: "customers" });
    }

    // Determine whether caller passed an ID or a name
    let marketId: string | null = null;
    let marketName: string | null = null;

    if (looksLikeUuid(marketParam)) {
      marketId = marketParam;
    } else {
      marketName = marketParam;

      // Resolve the name to an ID and prefer the join-table path when possible
      const { data: loc, error: locErr } = await supabase
        .from("company_locations")
        .select("id, name")
        .eq("company_id", company_id)
        .eq("name", marketName) // change to .ilike("name", marketName) for case-insensitive
        .maybeSingle();

      if (!locErr && loc?.id) {
        marketId = loc.id;
      }
    }

    // 1) Join-table filter by market_id (preferred)
    if (marketId) {
      const join = await supabase
        .from("company_customer_markets")
        .select("customer_id")
        .eq("company_id", company_id)
        .eq("market_id", marketId);

      if (!join.error && (join.data?.length ?? 0) > 0) {
        const ids = (join.data ?? []).map((r: { customer_id: string }) => r.customer_id);
        if (ids.length === 0) {
          return NextResponse.json(flat ? [] : { rows: [], via: `customers:market_id:${marketId}` });
        }

        const { data, error } = await supabase
          .from("company_customers")
          .select("id, name, market")
          .eq("company_id", company_id)
          .in("id", ids)
          .order("name", { ascending: true });

        if (error) {
          const payload = { rows: [], error: error.message };
          return NextResponse.json(flat ? [] : payload, { status: 500 });
        }
        const rows = data ?? [];
        return NextResponse.json(flat ? rows : { rows, via: `customers:market_id:${marketId}` });
      }
    }

    // 2) Fallback: name-based filtering (legacy column stores name)
    if (marketName) {
      const { data, error } = await supabase
        .from("company_customers")
        .select("id, name, market")
        .eq("company_id", company_id)
        .eq("market", marketName)
        .order("name", { ascending: true });

      if (error) {
        const payload = { rows: [], error: error.message };
        return NextResponse.json(flat ? [] : payload, { status: 500 });
      }
      const rows = data ?? [];
      return NextResponse.json(flat ? rows : { rows, via: `customers:market_name:${marketName}` });
    }

    // If we got here, nothing matched
    return NextResponse.json(flat ? [] : { rows: [], via: "customers:none" });
  }

  // catch-all for unknown scopes
  return NextResponse.json(flat ? [] : { rows: [] });
}
