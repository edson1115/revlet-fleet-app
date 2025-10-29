// app/api/dispatch/queue/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/dispatch/queue?status=ready|scheduled|all&limit=200
 * - ready: items Office sent for dispatch (READY_FOR_DISPATCH or NEW if you want)
 * - scheduled: items already scheduled (SCHEDULED_IN_SESSION)
 */
export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const url = new URL(req.url);
  const status = (url.searchParams.get("status") || "ready").toLowerCase();
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 500);

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id || null;
  if (!uid) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // must be DISPATCHER or ADMIN to use this API
  const { data: prof } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", uid)
    .maybeSingle();

  const role = String(prof?.role || "").toUpperCase();
  if (!["DISPATCHER", "ADMIN"].includes(role)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const company_id = prof?.company_id || null;

  let q = supabase
    .from("service_requests")
    .select("id, company_id, status, technician_id, customer_id, vehicle_id, location_id, scheduled_for, created_at, notes, po_number", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (company_id) q = q.eq("company_id", company_id);

  if (status === "ready") {
    q = q.in("status", ["READY_FOR_DISPATCH", "NEW"]); // include NEW if you want dispatch to grab straight away
  } else if (status === "scheduled") {
    q = q.eq("status", "SCHEDULED_IN_SESSION");
  } // else all

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
