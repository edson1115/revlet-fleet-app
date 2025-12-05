// app/api/dispatch/queue/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

function toUiStatus(s: string | null): string {
  if (!s) return "NEW";
  return s.replace(/_/g, " ").toUpperCase();
}

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    if (!scope.uid) {
      return NextResponse.json([], { status: 401 });
    }

    // -----------------------------------------
    // Build base query
    // -----------------------------------------
    let q = supabase
      .from("service_requests")
      .select(
        `
        id,
        status,
        service,
        customer_id,
        scheduled_at,
        eta_start,
        eta_end,
        vehicle:vehicles(id, year, make, model, plate, unit_number),
        customer:customers(id, name)
      `
      )
      .in("status", [
        "NEW",
        "WAITING_TO_BE_SCHEDULED",
        "RESCHEDULE",
      ])
      .order("created_at", { ascending: false });

    // -----------------------------------------
    // Role scoping
    // -----------------------------------------
    if (scope.isSuper) {
      // no restrictions
    } 
    else if (scope.isCustomer) {
      q = q.eq("customer_id", scope.customer_id);
    } 
    else if (scope.isTech) {
      q = q.eq("technician_id", scope.uid);
    }
    else if (scope.isInternal) {
      if (scope.markets.length) {
        q = q.in("market", scope.markets);
      } else {
        return NextResponse.json([]);
      }
    } 
    else {
      return NextResponse.json([]);
    }

    // -----------------------------------------
    // Exec
    // -----------------------------------------
    const { data, error } = await q;

    if (error) {
      console.error("Queue API error:", error);
      return NextResponse.json([], { status: 500 });
    }

    // -----------------------------------------
    // Normalize rows for UI
    // -----------------------------------------
    const rows = (data || []).map((r: any) => ({
      id: r.id,
      status: toUiStatus(r.status),
      service: r.service,
      customer: r.customer ? { id: r.customer.id, name: r.customer.name } : null,
      vehicle: r.vehicle || null,
      scheduled_at: r.scheduled_at,
      eta_start: r.eta_start,
      eta_end: r.eta_end,
    }));

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("Queue route crash:", err);
    return NextResponse.json([], { status: 500 });
  }
}



