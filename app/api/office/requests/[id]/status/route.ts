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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await supabaseServer();
    const requestId = params.id;

    const { status: nextStatus } = await req.json();

    if (!nextStatus || !STATUS_FLOW.includes(nextStatus)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    /* ---------------------------------------
       AUTH
    --------------------------------------- */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* ---------------------------------------
       PROFILE + MARKET
    --------------------------------------- */
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active_market")
      .eq("id", user.id)
      .single();

    const ALLOWED = new Set([
      "OFFICE",
      "DISPATCH",
      "ADMIN",
      "SUPERADMIN",
    ]);

    if (!profile || !ALLOWED.has(profile.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    if (!profile.active_market) {
      return NextResponse.json(
        { error: "No market assigned" },
        { status: 403 }
      );
    }

    /* ---------------------------------------
       MARKET ID
    --------------------------------------- */
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

    /* ---------------------------------------
       LOAD REQUEST
    --------------------------------------- */
    const { data: reqRow } = await supabase
      .from("service_requests")
      .select("id, status, market_id")
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
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    /* ---------------------------------------
       STATUS RULES
    --------------------------------------- */
    const currentIndex = STATUS_FLOW.indexOf(reqRow.status);
    const nextIndex = STATUS_FLOW.indexOf(nextStatus);

    if (nextIndex !== currentIndex + 1) {
      return NextResponse.json(
        { error: "Invalid status transition" },
        { status: 400 }
      );
    }

    if (
      profile.role === "DISPATCH" &&
      !(reqRow.status === "TO_BE_SCHEDULED" && nextStatus === "SCHEDULED")
    ) {
      return NextResponse.json(
        { error: "Dispatch cannot perform this transition" },
        { status: 403 }
      );
    }

    /* ---------------------------------------
       UPDATE
    --------------------------------------- */
    const { error: updateErr } = await supabase
      .from("service_requests")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: nextStatus,
    });
  } catch (err: any) {
    console.error("Status update error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
