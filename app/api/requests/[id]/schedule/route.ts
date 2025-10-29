// app/api/requests/[id]/schedule/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/requests/:id/schedule
 * Body: { scheduled_for: ISO string (date/time), technician_id: uuid }
 * Dispatcher/Admin only. Sets status -> SCHEDULED_IN_SESSION
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const { id } = params;

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id || null;
  if (!uid) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { data: prof } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", uid)
    .maybeSingle();

  const role = String(prof?.role || "").toUpperCase();
  if (!["DISPATCHER", "ADMIN"].includes(role)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const company_id = prof?.company_id || null;

  const body = await req.json().catch(() => ({}));
  const technician_id = body?.technician_id ? String(body.technician_id) : null;
  const scheduled_for = body?.scheduled_for ? new Date(body.scheduled_for).toISOString() : null;

  if (!technician_id || !scheduled_for) {
    return NextResponse.json({ ok: false, error: "technician_id and scheduled_for required" }, { status: 400 });
  }

  // Verify request & company
  const { data: reqRow, error: reqErr } = await supabase
    .from("service_requests")
    .select("id, company_id")
    .eq("id", id)
    .maybeSingle();
  if (reqErr) return NextResponse.json({ ok: false, error: reqErr.message }, { status: 500 });
  if (!reqRow) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  if (company_id && reqRow.company_id && reqRow.company_id !== company_id && role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "cross-company forbidden" }, { status: 403 });
  }

  // Verify technician
  const { data: tech, error: techErr } = await supabase
    .from("technicians")
    .select("id, company_id, name")
    .eq("id", technician_id)
    .maybeSingle();
  if (techErr) return NextResponse.json({ ok: false, error: techErr.message }, { status: 500 });
  if (!tech) return NextResponse.json({ ok: false, error: "technician_not_found" }, { status: 400 });
  if (company_id && tech.company_id && tech.company_id !== company_id && role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "technician_wrong_company" }, { status: 403 });
  }

  // Apply scheduling
  const { data: updated, error: upErr } = await supabase
    .from("service_requests")
    .update({
      technician_id,
      scheduled_for,
      status: "SCHEDULED_IN_SESSION",
    })
    .eq("id", id)
    .select("id, technician_id, scheduled_for, status, updated_at")
    .maybeSingle();

  if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });

  // Audit
  try {
    await supabase.from("service_events").insert({
      request_id: id,
      event_type: "SCHEDULE",
      message: `Scheduled for ${scheduled_for} with tech ${technician_id}`,
      created_by: uid,
    });
  } catch {}

  return NextResponse.json({ ok: true, data: updated });
}
