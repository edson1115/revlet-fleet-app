import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ----------------------------------------
   MARKET NORMALIZATION
---------------------------------------- */
function normalizeMarket(name: string) {
  if (!name) return null;

  // Explicit known mappings (safe + clear)
  const MAP: Record<string, string> = {
    NorCal: "NorCal",
    SanAntonio: "San Antonio",
    Dallas: "Dallas",
    Houston: "Houston",
    Washington: "Washington",
  };

  return MAP[name] ?? name;
}

export async function GET() {
  try {
    const supabase = await supabaseServer();

    /* -----------------------------
       AUTH
    ----------------------------- */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* -----------------------------
       PROFILE
    ----------------------------- */
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("role, active_market")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 403 }
      );
    }

    const ALLOWED = new Set([
      "OFFICE",
      "DISPATCH",
      "ADMIN",
      "SUPERADMIN",
    ]);

    if (!ALLOWED.has(profile.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    if (!profile.active_market) {
      return NextResponse.json(
        { error: "Invalid market" },
        { status: 403 }
      );
    }

    /* -----------------------------
       RESOLVE MARKET ID
    ----------------------------- */
    const marketName = normalizeMarket(profile.active_market);

    const { data: market, error: marketErr } = await supabase
      .from("markets")
      .select("id")
      .eq("name", marketName)
      .single();

    if (marketErr || !market) {
      console.error("Market lookup failed:", {
        active_market: profile.active_market,
        normalized: marketName,
      });

      return NextResponse.json(
        { error: "Market not found" },
        { status: 403 }
      );
    }

    /* -----------------------------
       LOAD QUEUE
    ----------------------------- */
    const { data: rows, error } = await supabase
      .from("service_requests")
      .select(`
        id,
        type,
        status,
        service,
        notes,
        created_at,
        customer:customers (
          name
        ),
        vehicle:vehicles (
          year,
          make,
          model,
          plate
        )
      `)
      .eq("market_id", market.id)
      .in("status", [
        "NEW",
        "WAITING",
        "TO_BE_SCHEDULED",
      ])
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Queue query error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      rows: rows ?? [],
    });
  } catch (err: any) {
    console.error("Office queue error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
