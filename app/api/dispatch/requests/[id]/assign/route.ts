import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/*
  DISPATCH assigns:
  - technician_id
  - scheduled_start_at
  - scheduled_end_at

  Rules:
  - DISPATCH only
  - Market locked
  - OFFICE data is read-only here
*/

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await supabaseServer();
    const requestId = params.id;

    const { technician_id, scheduled_start_at, scheduled_end_at } =
      await req.json();

    if (!technician_id || !scheduled_start_at || !scheduled_end_at) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* ================= AUTH ================= */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* ================= PROFILE ================= */
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active_market")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "DISPATCH") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    if (!profile.active_market) {
      return NextResponse.json(
        { error: "No active market assigned" },
        { status: 403 }
      );
    }

    /* ================= MARKET ================= */
    const { data: market } = await supabase
      .from("markets")
      .select("id")
      .eq("name", profile.active_market)
      .single();

    if (!market) {
      return NextResponse.json(
        { error: "Market not found" },
        { status: 403 }
      );
    }

    /* ================= LOAD REQUEST ================= */
    const { data: reqRow } = await supabase
      .from("service_requests")
      .select("id, market_id, status")
      .eq("id", requestId)
      .single();

    if (!reqRow) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (reqRow.market_id !== market.id) {
      return NextResponse.json(
        { error: "Forbidden (market mismatch)" },
        { status: 403 }
      );
    }

    /* ================= STATUS GUARD =================
       DISPATCH can ONLY assign when request is:
       TO_BE_SCHEDULED
    */
    if (reqRow.status !== "TO_BE_SCHEDULED") {
      return NextResponse.json(
        { error: "Request not ready for scheduling" },
        { status: 400 }
      );
    }

    /* ================= UPDATE ================= */
    const { error: updateErr } = await supabase
      .from("service_requests")
      .update({
        technician_id,
        scheduled_start_at,
        scheduled_end_at,
        status: "SCHEDULED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to assign technician" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: "SCHEDULED",
    });
  } catch (err: any) {
    console.error("Dispatch assign error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
