// app/api/tech/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { DB_TO_UI_STATUS } from "@/lib/status";

// Map DB rows → light UI shape the Tech app expects
function toUiRow(r: any) {
  return {
    id: r.id,
    status: DB_TO_UI_STATUS[r.status] ?? r.status,
    created_at: r.created_at,
    scheduled_at: r.scheduled_at,
    service: r.service ?? null,
    fmc: r.fmc ?? null,
    po: r.po ?? null,
    notes: r.notes ?? null,
    dispatch_notes: r.dispatch_notes ?? null,
    mileage: r.mileage ?? null,
    priority: r.priority ?? null,
    customer: r.customers ? { id: r.customers.id, name: r.customers.name } : null,
    location: r.locations ? { id: r.locations.id, name: r.locations.name } : null,
    vehicle: r.vehicles
      ? {
          id: r.vehicles.id,
          unit_number: r.vehicles.unit_number,
          year: r.vehicles.year,
          make: r.vehicles.make,
          model: r.vehicles.model,
          plate: r.vehicles.plate,
        }
      : null,
    technician: r.technicians ? { id: r.technicians.id, name: r.technicians.full_name ?? r.technicians.name ?? null } : null,
  };
}

export const dynamic = "force-dynamic";

/**
 * GET /api/tech/requests
 * Query params (optional):
 * - scope: "today" | "upcoming" | "all" (default "today")
 * - status: CSV of UI statuses to include, e.g. "SCHEDULED,IN PROGRESS"
 * - sortBy: defaults to scheduled_at
 * - sortDir: "asc" | "desc" (default "asc")
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = supabaseServer();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Look up company and technician id for this user
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("company_id, technician_id")
      .eq("id", user.id)
      .single();

    if (pErr || !profile?.company_id) {
      return NextResponse.json({ error: "No company scope" }, { status: 403 });
    }
    if (!profile.technician_id) {
      // Tech app with no tech mapping → empty
      return NextResponse.json({ rows: [] });
    }

    const url = new URL(req.url);
    const scope = (url.searchParams.get("scope") || "today").toLowerCase();
    const statusCsv = url.searchParams.get("status") || ""; // UI statuses (optional)
    const sortBy = url.searchParams.get("sortBy") || "scheduled_at";
    const sortDir = (url.searchParams.get("sortDir") || "asc").toLowerCase() === "desc" ? "desc" : "asc";

    // Build base query
    let q = supabase
      .from("service_requests")
      .select(`
        id, status, created_at, scheduled_at, service, fmc, po, notes, dispatch_notes, mileage, priority,
        company_id, technician_id,
        customers:customer_id ( id, name ),
        locations:location_id ( id, name ),
        vehicles:vehicle_id ( id, unit_number, year, make, model, plate ),
        technicians:technician_id ( id, full_name, name )
      `)
      .eq("company_id", profile.company_id)
      .eq("technician_id", profile.technician_id);

    // Scope window
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0,0,0,0);
    const endOfToday = new Date(now); endOfToday.setHours(23,59,59,999);

    if (scope === "today") {
      q = q.gte("scheduled_at", startOfToday.toISOString()).lte("scheduled_at", endOfToday.toISOString());
    } else if (scope === "upcoming") {
      q = q.gt("scheduled_at", endOfToday.toISOString());
    } else {
      // "all" → no extra date filter
    }

    // Optional status filter (UI → DB handled in RLS/DB_TO_UI later; here we match flexibly)
    if (statusCsv) {
      const uiStatuses = statusCsv.split(",").map((s) => s.trim()).filter(Boolean);
      if (uiStatuses.length) {
        // Let DB comparison be on raw status; accept either UI or DB tokens defensively
        q = q.in("status", uiStatuses);
      }
    }

    // Sort
    q = q.order(sortBy, { ascending: sortDir === "asc" });

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data || []).map(toUiRow);
    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Server error" }, { status: 500 });
  }
}
