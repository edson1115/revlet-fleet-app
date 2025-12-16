import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUS_FLOW = [
  "NEW",
  "WAITING",
  "TO_BE_SCHEDULED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
];

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await context.params;
    const { status: nextStatus } = await req.json();

    if (!STATUS_FLOW.includes(nextStatus)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

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

    /* -----------------------------
       USER MARKET → ID
    ----------------------------- */
    const { data: userMarket } = await supabase
      .from("markets")
      .select("id")
      .eq(
        "name",
        profile.active_market.replace(/([a-z])([A-Z])/g, "$1 $2")
      )
      .single();

    if (!userMarket) {
      return NextResponse.json(
        { error: "Market not found" },
        { status: 403 }
      );
    }

    /* -----------------------------
       LOAD REQUEST
    ----------------------------- */
    const { data: reqRow } = await supabase
      .from("service_requests")
      .select("id, status, market_id")
      .eq("id", requestId)
      .maybeSingle();

    if (!reqRow) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (reqRow.market_id !== userMarket.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* -----------------------------
       STATUS RULES
    ----------------------------- */
    const currentIndex = STATUS_FLOW.indexOf(reqRow.status);
    const nextIndex = STATUS_FLOW.indexOf(nextStatus);

    // Must move forward exactly one step
    if (nextIndex !== currentIndex + 1) {
      return NextResponse.json(
        { error: "Invalid status transition" },
        { status: 400 }
      );
    }

    // Dispatch restriction
    if (
      profile.role === "DISPATCH" &&
      !(reqRow.status === "TO_BE_SCHEDULED" && nextStatus === "SCHEDULED")
    ) {
      return NextResponse.json(
        { error: "Dispatch cannot perform this transition" },
        { status: 403 }
      );
    }

    /* -----------------------------
       UPDATE
    ----------------------------- */
    const { error: updateError } = await supabase
      .from("service_requests")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Request status update error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
