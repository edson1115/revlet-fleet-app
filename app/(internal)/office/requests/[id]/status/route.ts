import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ============================================================
   PATCH — Update Request Status (Office / Dispatch)
============================================================ */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await supabaseServer();

    /* ----------------------------------
       AUTH
    ---------------------------------- */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = normalizeRole(user.user_metadata?.role);
    const ALLOWED = new Set([
      "OFFICE",
      "DISPATCH",
      "ADMIN",
      "SUPERADMIN",
    ]);

    if (!role || !ALLOWED.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* ----------------------------------
       BODY
    ---------------------------------- */
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status required" },
        { status: 400 }
      );
    }

    /* ----------------------------------
       VALID STATUS FLOW
    ---------------------------------- */
    const STATUS_FLOW = [
      "NEW",
      "WAITING",
      "TO_BE_SCHEDULED",
      "SCHEDULED",
      "IN_PROGRESS",
      "COMPLETED",
    ];

    if (!STATUS_FLOW.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    /* ----------------------------------
       LOAD PROFILE (MARKET SAFETY)
    ---------------------------------- */
    const { data: profile } = await supabase
      .from("profiles")
      .select("active_market")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.active_market) {
      return NextResponse.json(
        { error: "Market not assigned" },
        { status: 403 }
      );
    }

    /* ----------------------------------
       LOAD REQUEST (VERIFY MARKET)
    ---------------------------------- */
    const { data: existing } = await supabase
      .from("service_requests")
      .select("id, status")
      .eq("id", params.id)
      .eq("market", profile.active_market)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    /* ----------------------------------
       ROLE RULES
    ---------------------------------- */

    // Dispatch can only move from TO_BE_SCHEDULED → SCHEDULED
    if (role === "DISPATCH") {
      if (
        existing.status !== "TO_BE_SCHEDULED" ||
        status !== "SCHEDULED"
      ) {
        return NextResponse.json(
          { error: "Dispatch cannot perform this status change" },
          { status: 403 }
        );
      }
    }

    /* ----------------------------------
       UPDATE STATUS
    ---------------------------------- */
    const { error } = await supabase
      .from("service_requests")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      status,
    });
  } catch (err: any) {
    console.error("Office status update error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
