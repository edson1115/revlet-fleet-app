import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await context.params;
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active_market")
      .eq("id", user.id)
      .single();

    const ALLOWED = new Set(["OFFICE", "DISPATCH", "ADMIN", "SUPERADMIN"]);

    if (!profile || !ALLOWED.has(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!profile.active_market) {
      return NextResponse.json(
        { error: "No active market assigned" },
        { status: 403 }
      );
    }

    /* -----------------------------
       RESOLVE USER MARKET → ID
    ----------------------------- */
    const { data: userMarket } = await supabase
      .from("markets")
      .select("id")
      .eq("name", profile.active_market.replace(/([a-z])([A-Z])/g, "$1 $2"))
      .single();

    if (!userMarket) {
      return NextResponse.json(
        { error: "User market not found" },
        { status: 403 }
      );
    }

    /* -----------------------------
       LOAD REQUEST
    ----------------------------- */
    const { data: reqRow } = await supabase
      .from("service_requests")
      .select(`
        id,
        type,
        status,
        service,
        notes,
        dispatch_notes,
        urgent,
        po,
        tire_size,
        tire_quantity,
        dropoff_address,
        created_at,
        scheduled_start_at,
        scheduled_end_at,
        completed_at,
        market_id,

        vehicle:vehicles (
          id,
          year,
          make,
          model,
          plate,
          unit_number,
          vin
        ),

        technician:profiles!technician_id (
          id,
          full_name
        ),

        customer:customers (
          id,
          name
        )
      `)
      .eq("id", requestId)
      .maybeSingle();

    if (!reqRow) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    /* -----------------------------
       FINAL MARKET SECURITY CHECK
    ----------------------------- */
    if (reqRow.market_id !== userMarket.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* -----------------------------
       SUCCESS
    ----------------------------- */
    return NextResponse.json({
      ok: true,
      request: reqRow,
    });
  } catch (err: any) {
    console.error("Office request detail error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
