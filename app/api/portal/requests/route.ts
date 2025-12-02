// app/api/portal/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import { DB_TO_UI_STATUS } from "@/lib/status";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* Convert DB → UI status */
function toUiStatus(dbVal?: string | null): string {
  return DB_TO_UI_STATUS[dbVal ?? ""] ?? dbVal ?? "NEW";
}

/* ============================================================
   GET /api/portal/requests
   List requests for logged-in CUSTOMER.
============================================================ */
export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    if (!scope.uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!scope.isCustomer) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || "300");
    const statusCsv = url.searchParams.get("status");

    let q = supabase
      .from("service_requests")
      .select(
        `
          id,
          status,
          service,
          notes,
          dispatch_notes,
          mileage,
          priority,
          po,
          fmc_text,
          created_at,
          scheduled_at,
          scheduled_end_at,
          completed_at,
          customer_id,
          location_id,
          vehicle_id,
          technician_id,

          customer:customers(id, name, market),
          vehicle:vehicles(id, year, make, model, plate, unit_number),
          location:locations(id, name, market),
          technician:profiles(id, full_name)
        `
      )
      .eq("customer_id", scope.customer_id)
      .order("created_at", { ascending: false })
      .limit(Math.min(limit, 400));

    if (statusCsv) {
      const dbStatuses = statusCsv
        .split(",")
        .map((s) => s.trim());
      q = q.in("status", dbStatuses);
    }

    const { data, error } = await q;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data?.length) {
      return NextResponse.json({ rows: [] });
    }

    const rows = data.map((r: any) => ({
      id: r.id,
      status: toUiStatus(r.status),
      service: r.service,
      notes: r.notes,
      dispatch_notes: r.dispatch_notes,
      mileage: r.mileage,
      priority: r.priority,
      po: r.po,
      fmc: r.fmc_text,

      created_at: r.created_at,
      scheduled_at: r.scheduled_at,
      scheduled_end_at: r.scheduled_end_at,
      completed_at: r.completed_at,

      customer: r.customer,
      vehicle: r.vehicle,
      location: r.location,
      technician: r.technician,
    }));

    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "failed" },
      { status: 500 }
    );
  }
}
