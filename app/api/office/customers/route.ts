import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ============================================================
   GET — List customers for Office (market-scoped)
============================================================ */
export async function GET() {
  try {
    const supabase = await supabaseServer();

    // AUTH
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ROLE (fallback UNKNOWN → OFFICE for internal users)
    let role = normalizeRole(user.user_metadata?.role);

    // FIX: Cast role to string to silence the "no overlap" error
if (!role || (role as string) === "UNKNOWN") {
  role = "OFFICE";
}

    const ALLOWED = new Set([
      "OFFICE",
      "DISPATCH",
      "ADMIN",
      "SUPERADMIN",
      "FLEET_MANAGER",
    ]);

    if (!ALLOWED.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // MARKET
    const { data: profile } = await supabase
      .from("profiles")
      .select("active_market")
      .eq("id", user.id)
      .maybeSingle();

    const market = profile?.active_market;

    if (!market) {
      return NextResponse.json(
        { error: "No active market" },
        { status: 400 }
      );
    }

    // CUSTOMERS
    const { data: customers, error } = await supabase
      .from("customers")
      .select("id, name")
      .eq("market", market)
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to load customers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      customers: customers ?? [],
    });
  } catch (err: any) {
    console.error("Office customers list error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
