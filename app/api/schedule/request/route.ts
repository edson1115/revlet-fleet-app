import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/schedule/request
 *
 * Body:
 * {
 * request_id: string
 * technician_id: string
 * start: string (ISO)
 * end: string (ISO)
 * }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { request_id, technician_id, start, end } = body;

    if (!request_id || !technician_id || !start || !end) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    if (!scope.uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // --------------------------------------------------------
    // Permission logic
    // --------------------------------------------------------
    if (scope.isTech && scope.uid !== technician_id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (scope.isCustomer) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // --------------------------------------------------------
    // Load the service request to validate market ownership
    // --------------------------------------------------------
    const { data: existing, error: existingErr } = await supabase
      .from("service_requests")
      .select("id, customer:customers(market), location:locations(market)")
      .eq("id", request_id)
      .maybeSingle();

    if (existingErr || !existing) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Helper: Safely extract market whether relation returns object or array
    const getMarket = (relation: any) => {
      if (Array.isArray(relation)) return relation[0]?.market;
      return relation?.market;
    };

    const reqMarket = getMarket(existing.customer) || getMarket(existing.location) || null;

    // Cast scope to 'any' to safely access 'markets' property if it exists at runtime but not in type
    const userScope = scope as any;
    
    // FIX: Replaced 'scope.isInternal' with '!scope.isCustomer'
    // Check market permissions for internal staff (excluding superadmins)
    if (!scope.isCustomer && !scope.isSuperadmin && userScope.markets && reqMarket) {
       if (!userScope.markets.includes(reqMarket)) {
          return NextResponse.json({ error: "Market access denied" }, { status: 403 });
       }
    }

    // --------------------------------------------------------
    // Prevent double-booking window
    // --------------------------------------------------------
    const { data: conflicts, error: conflictErr } = await supabase
      .from("schedule_blocks")
      .select("*")
      .eq("technician_id", technician_id)
      .lte("start_at", end)
      .gte("end_at", start);

    if (conflictErr) {
      return NextResponse.json(
        { error: conflictErr.message },
        { status: 500 }
      );
    }

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: "Technician is already booked in this window" },
        { status: 409 }
      );
    }

    // --------------------------------------------------------
    // Upsert the schedule block for this request
    // --------------------------------------------------------
    // Clear existing blocks for this request first
    await supabase
      .from("schedule_blocks")
      .delete()
      .eq("request_id", request_id);

    const { error: insertBlockErr } = await supabase
      .from("schedule_blocks")
      .insert({
        request_id,
        technician_id,
        start_at: start,
        end_at: end,
      });

    if (insertBlockErr) {
      return NextResponse.json(
        { error: insertBlockErr.message },
        { status: 500 }
      );
    }

    // --------------------------------------------------------
    // Update the main request record
    // --------------------------------------------------------
    const { error: updateErr } = await supabase
      .from("service_requests")
      .update({
        technician_id,
        scheduled_at: start,
        scheduled_end_at: end,
        status: "SCHEDULED",
        updated_at: new Date().toISOString()
      })
      .eq("id", request_id);

    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("/api/schedule/request error", e);
    return NextResponse.json(
      { error: e?.message || "failed" },
      { status: 500 }
    );
  }
}