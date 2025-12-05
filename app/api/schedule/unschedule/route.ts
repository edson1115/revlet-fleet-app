// app/api/schedule/unschedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/schedule/unschedule
 *
 * Body:
 * {
 *   request_id: string
 * }
 *
 * Behavior:
 * - remove schedule_blocks rows for this request
 * - clear scheduled_at / scheduled_end_at / technician_id
 * - set status = "RESCHEDULE" (unless completed)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.request_id) {
      return NextResponse.json(
        { error: "Missing request_id" },
        { status: 400 }
      );
    }

    const request_id = String(body.request_id).trim();

    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    if (!scope.uid)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // -------------------------------------------------------
    // Load existing request
    // -------------------------------------------------------
    const { data: reqRow, error: loadErr } = await supabase
      .from("service_requests")
      .select("id, technician_id, status, customer_id, location_id")
      .eq("id", request_id)
      .maybeSingle();

    if (loadErr || !reqRow) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // -------------------------------------------------------
    // Permission checks
    // -------------------------------------------------------
    if (scope.isCustomer) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (scope.isTech) {
      // tech can only unschedule their own job
      if (reqRow.technician_id !== scope.uid)
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (scope.isInternal && !scope.isSuper) {
      // match markets
      const { data: loc } = await supabase
        .from("locations")
        .select("id, market")
        .eq("id", reqRow.location_id)
        .maybeSingle();

      if (loc && !scope.markets.includes(loc.market)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    // -------------------------------------------------------
    // 1. Delete schedule blocks
    // -------------------------------------------------------
    const { error: delErr } = await supabase
      .from("schedule_blocks")
      .delete()
      .eq("request_id", request_id);

    if (delErr) {
      return NextResponse.json(
        { error: delErr.message },
        { status: 500 }
      );
    }

    // -------------------------------------------------------
    // 2. Clear schedule fields
    // -------------------------------------------------------
    const update: any = {
      scheduled_at: null,
      scheduled_end_at: null,
      technician_id: null,
    };

    // Only change status if not completed
    if (reqRow.status !== "COMPLETED") {
      update.status = "RESCHEDULE";
    }

    const { error: updateErr } = await supabase
      .from("service_requests")
      .update(update)
      .eq("id", request_id);

    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("unschedule error:", e);
    return NextResponse.json(
      { error: e?.message || "failed" },
      { status: 500 }
    );
  }
}



