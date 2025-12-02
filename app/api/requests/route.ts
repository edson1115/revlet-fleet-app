// app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = supabaseServer();
  const scope = await resolveUserScope();

  if (!scope.uid) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);

  // optional filters
  const statusFilter = url.searchParams.get("status")?.split(",").filter(Boolean) || null;
  const sortBy = url.searchParams.get("sortBy") ?? "created_at";
  const sortDir = url.searchParams.get("sortDir") ?? "desc";

  // ---------- BASE QUERY ----------
  let query = supabase
    .from("service_requests")
    .select(
      `
      id,
      status,
      service,
      created_at,
      scheduled_at,
      customer:customers(name, id),
      location:locations(name, id),
      vehicle:vehicles(year, make, model, plate, unit_number, id),
      technician:profiles(full_name, id)
    `
    );

  // ---------- ROLE SCOPING ----------
  if (scope.isInternal) {
    // Office/Dispatch/Admin/Super can see everything in their allowed markets
    if (scope.markets.length > 0) {
      query = query.in("market", scope.markets);
    }
  }

  else if (scope.isTech) {
    query = query.eq("technician_id", scope.uid);
  }

  else if (scope.isCustomer) {
    query = query.eq("customer_id", scope.customer_id);
  }

  else {
    return NextResponse.json(
      { ok: false, error: "Invalid role" },
      { status: 403 }
    );
  }

  // ---------- STATUS FILTER ----------
  if (statusFilter && statusFilter.length > 0) {
    query = query.in("status", statusFilter);
  }

  // ---------- SORT ----------
  query = query.order(sortBy, { ascending: sortDir === "asc" });

  const { data, error } = await query;

  if (error) {
    console.error("GET /api/requests error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, rows: data });
}
