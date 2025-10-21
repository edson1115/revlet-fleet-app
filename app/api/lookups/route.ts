// app/api/lookups/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

async function resolveCompanyId() {
  const supabase = await supabaseServer();

  // 1) profiles.company_id
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

  // 2) fallback: newest vehicle with company_id
  const { data: v } = await supabase
    .from("vehicles")
    .select("company_id")
    .not("company_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { supabase, company_id: (v?.company_id as string) ?? null };
}

export async function GET(req: Request) {
  try {
    const { company_id, supabase } = await resolveCompanyId();
    if (!company_id) {
      return NextResponse.json({ error: "No company" }, { status: 400 });
    }

    const url = new URL(req.url);
    const scope = (url.searchParams.get("scope") || "").toLowerCase();

    // -------- LOCATIONS (markets + sites), robust to missing order_index
    if (scope === "locations") {
      let markets: any[] | null = null;
      let mErr: any = null;

      // Try with order_index first
      {
        const { data, error } = await supabase
          .from("company_locations")
          .select("id,name,order_index")
          .eq("company_id", company_id)
          .eq("location_type", "MARKET")
          .order("order_index", { ascending: true, nullsFirst: true })
          .order("name", { ascending: true });
        markets = data ?? null;
        mErr = error ?? null;
      }

      // If order_index missing, retry without it and synthesize
      if (mErr && /order_index/i.test(mErr.message || "")) {
        const { data, error } = await supabase
          .from("company_locations")
          .select("id,name")
          .eq("company_id", company_id)
          .eq("location_type", "MARKET")
          .order("name", { ascending: true });
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        markets = (data ?? []).map((m: any, idx: number) => ({ ...m, order_index: idx }));
        mErr = null;
      }

      const { data: sites, error: sErr } = await supabase
        .from("company_locations")
        .select("id,name")
        .eq("company_id", company_id)
        .eq("location_type", "SITE")
        .order("name");

      if (mErr || sErr) {
        return NextResponse.json(
          { error: mErr?.message || sErr?.message || "Failed to load locations" },
          { status: 500 }
        );
      }

      return NextResponse.json({ markets: markets ?? [], sites: sites ?? [] });
    }

    // -------- CUSTOMERS (filter by market id or name; if no market → all)
    if (scope === "customers") {
      let marketParam = url.searchParams.get("market");
      let marketId: string | null = null;

      if (marketParam) {
        marketParam = marketParam.trim();
        if (isUuid(marketParam)) {
          marketId = marketParam; // already id
        } else {
          const { data: loc } = await supabase
            .from("company_locations")
            .select("id")
            .eq("company_id", company_id)
            .eq("location_type", "MARKET")
            .ilike("name", marketParam)
            .maybeSingle();
          if (loc?.id) marketId = loc.id as string;
        }
      }

      let q = supabase
        .from("company_customers")
        .select("id,name,market")
        .eq("company_id", company_id)
        .order("name");
      if (marketId) q = q.eq("market", marketId);

      const { data: customers, error } = await q;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ customers: customers ?? [] });
    }

    // -------- FMC (optional)
    if (scope === "fmc") {
      const { data, error } = await supabase
        .from("fmc_options")
        .select("id,label")
        .order("label");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ options: data ?? [] });
    }

    // -------- TECHS (schema-tolerant: no hard dependency on full_name)
    // Primary: role ILIKE 'TECH'. Fallback: if zero, return other profiles in company (up to 10).
    if (scope === "techs") {
      const { data: allProfiles, error } = await supabase
        .from("profiles")
        .select("*") // tolerate unknown columns (no full_name required)
        .eq("company_id", company_id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const toName = (p: any) =>
        (p.full_name as string) ||
        (p.name as string) ||
        (p.email as string) ||
        "User";

      const sorted = (allProfiles ?? []).sort((a: any, b: any) =>
        toName(a).localeCompare(toName(b))
      );

      const primary = sorted.filter(
        (p: any) => String(p.role || "").toUpperCase() === "TECH"
      );
      let techs = primary.map((p: any) => ({ id: p.id as string, name: toName(p) }));

      // Fallback when no TECH yet: surface up to 10 profiles so UI remains usable
      if (!techs.length) {
        techs = sorted.slice(0, 10).map((p: any) => ({
          id: p.id as string,
          name: toName(p),
        }));
      }

      return NextResponse.json({ techs });
    }

    return NextResponse.json({ error: "Unsupported scope" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
