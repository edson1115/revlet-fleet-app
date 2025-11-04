// app/api/requests/schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Super-admin allow list (reuse pattern from other routes) */
function isSuperAdminEmail(email?: string | null) {
  const envList = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const fallback = "edson.cortes@bigo.com";
  const e = (email || "").toLowerCase();
  return !!e && (envList.includes(e) || e === fallback);
}

/** Next weekday at given local hour (default 4:00) */
function nextWeekdayAtHourLocal(hour = 4): Date {
  const d = new Date();
  // Start from "tomorrow"
  d.setDate(d.getDate() + 1);
  // If weekend, bump to Monday
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** Try to parse incoming date; if invalid, return null */
function tryParseDate(val: any): Date | null {
  if (!val && val !== 0) return null;

  if (typeof val === "number") {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof val === "string") {
    const s = val.trim();

    // Support "MM/DD/YY" or "MM/DD/YYYY" with optional time "HH:mm"
    const mdyslash = /^(\d{1,2})[\/](\d{1,2})[\/](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?$/;
    const m = s.match(mdyslash);
    if (m) {
      const mm = parseInt(m[1], 10);
      const dd = parseInt(m[2], 10);
      let yyyy = parseInt(m[3], 10);
      if (yyyy < 100) yyyy += 2000;
      const hh = m[4] ? parseInt(m[4], 10) : 0;
      const mi = m[5] ? parseInt(m[5], 10) : 0;
      const d = new Date(yyyy, mm - 1, dd, hh, mi, 0, 0);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    // Fallback to Date parser (ISO / "YYYY-MM-DDTHH:mm" etc.)
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * POST /api/requests/schedule
 * Body:
 *   - id: string (required)
 *   - technician_id?: string | null
 *   - scheduled_at?: string | number | null
 *
 * Behavior:
 *   - If technician_id present:
 *       - scheduled_at = provided (if valid) OR next weekday 4am (local)
 *       - status = 'SCHEDULED'
 *   - If technician_id is null:
 *       - scheduled_at = null
 *       - status = 'WAITING_TO_BE_SCHEDULED'
 */
export async function POST(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const body = await req.json().catch(() => ({} as any));

    // Auth & scope
    const { data: auth } = await sb.auth.getUser();
    const uid = auth?.user?.id || null;
    const email = auth?.user?.email || null;
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { data: prof } = await sb
      .from("profiles")
      .select("company_id, role")
      .eq("id", uid)
      .maybeSingle();

    const meta = (auth?.user?.user_metadata ?? {}) as Record<string, any>;
    const role = (prof?.role ?? meta?.role ?? (isSuperAdminEmail(email) ? "ADMIN" : null)) as string | null;
    const isAdmin = String(role || "").toUpperCase() === "ADMIN" || isSuperAdminEmail(email);
    const company_id = prof?.company_id ?? meta?.company_id ?? null;

    // Input
    const id = String(body?.id || "").trim();
    if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

    const technician_id: string | null =
      body?.technician_id === null || body?.technician_id === ""
        ? null
        : typeof body?.technician_id === "string"
        ? body.technician_id
        : null;

    const parsed = tryParseDate(body?.scheduled_at);

    // Compute update payload based on rules
    let scheduledISO: string | null | undefined = undefined;
    let status: string | undefined = undefined;

    if (technician_id) {
      scheduledISO = parsed ? parsed.toISOString() : nextWeekdayAtHourLocal(4).toISOString();
      status = "SCHEDULED";
    } else if (body?.technician_id === null || body?.technician_id === "") {
      // Explicitly clearing assignment
      scheduledISO = null;
      status = "WAITING_TO_BE_SCHEDULED";
    } else if (parsed) {
      // Rare: date provided without technician (keep date, do not flip status)
      scheduledISO = parsed.toISOString();
    }

    const updateRow: Record<string, any> = {};
    if (body?.technician_id !== undefined) updateRow.technician_id = technician_id; // can be null
    if (scheduledISO !== undefined) updateRow.scheduled_at = scheduledISO;
    if (status !== undefined) updateRow.status = status;

    // No-op guard
    if (Object.keys(updateRow).length === 0) {
      return NextResponse.json({ error: "no_changes" }, { status: 400 });
    }

    let upd = sb.from("service_requests").update(updateRow).eq("id", id);
    if (!isAdmin && company_id) upd = upd.eq("company_id", company_id);

    const { data, error: upErr } = await upd
      .select("id, technician_id, scheduled_at, status, dispatch_notes")
      .single();

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

    return NextResponse.json({
      ok: true,
      row: {
        id: data.id,
        technician_id: data.technician_id,
        scheduled_at: data.scheduled_at,
        status: data.status,
        dispatch_notes: data.dispatch_notes ?? null,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
