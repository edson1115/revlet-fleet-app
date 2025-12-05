// app/api/office/queue/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/office/queue?status=open|all&limit=100
 * Office sees requests (focus on unscheduled + in-flight).
 */
export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const url = new URL(req.url);
  const status = (url.searchParams.get("status") || "open").toLowerCase(); // "open" | "all"
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 500);

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id || null;
  if (!uid) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { data: prof } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", uid)
    .maybeSingle();

  const company_id = prof?.company_id || null;

  let q = supabase
    .from("service_requests")
    .select("id, company_id, status, technician_id, customer_id, vehicle_id, location_id, scheduled_for, created_at, notes, po_number", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (company_id) q = q.eq("company_id", company_id);

  if (status === "open") {
    // Office focuses on anything not completed or canceled
    q = q.not("status", "in", "(COMPLETED,CANCELED)");
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}



