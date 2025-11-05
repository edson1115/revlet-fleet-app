// app/api/requests/reschedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isSuperAdminEmail(email?: string | null) {
  const envList = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const fallback = "edson.cortes@bigo.com";
  const e = (email || "").toLowerCase();
  return !!e && (envList.includes(e) || e === fallback);
}

/** POST /api/requests/reschedule
 * Body: { id: string, reason?: string }
 * Effect:
 *   - status -> 'RESCHEDULE'
 *   - scheduled_at -> null
 *   - technician_id -> null
 *   - append reason into dispatch_notes and add a timeline note
 */
export async function POST(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const body = await req.json().catch(() => ({} as any));

    const { data: auth } = await sb.auth.getUser();
    const uid = auth?.user?.id || null;
    const email = auth?.user?.email || null;
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // scope
    const { data: prof } = await sb
      .from("profiles")
      .select("company_id, role, full_name")
      .eq("id", uid)
      .maybeSingle();

    const meta = (auth?.user?.user_metadata ?? {}) as Record<string, any>;
    const role = (prof?.role ?? meta?.role ?? (isSuperAdminEmail(email) ? "ADMIN" : null)) as string | null;
    const isAdmin = String(role || "").toUpperCase() === "ADMIN" || isSuperAdminEmail(email);
    const company_id = prof?.company_id ?? meta?.company_id ?? null;
    const authorName = (prof as any)?.full_name || email || "Tech";

    const id = String(body?.id || "").trim();
    if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

    const reasonRaw = (body?.reason ?? "").toString().trim();
    const reason = reasonRaw || "Reschedule requested";

    // Load current dispatch_notes so we can append a line
    let sel = sb.from("service_requests").select("id, dispatch_notes, company_id").eq("id", id).single();
    if (!isAdmin && company_id) sel = sel.eq("company_id", company_id);
    const { data: current, error: selErr } = await sel;
    if (selErr || !current) return NextResponse.json({ error: selErr?.message || "not_found" }, { status: 404 });

    const appendedNotes = [
      current.dispatch_notes?.trim(),
      `Reschedule by ${authorName}: ${reason}`,
    ]
      .filter(Boolean)
      .join("\n");

    // Update request: clear tech + time, set status to RESCHEDULE, append dispatch_notes
    let upd = sb
      .from("service_requests")
      .update({
        status: "RESCHEDULE",
        technician_id: null,
        scheduled_at: null,
        dispatch_notes: appendedNotes,
      })
      .eq("id", id)
      .select("id, status, dispatch_notes, scheduled_at, technician_id")
      .single();

    if (!isAdmin && company_id) upd = upd.eq("company_id", company_id);
    const { data, error: upErr } = await upd;
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

    // Add a timeline note (best-effort; don't fail request if this insert fails)
    const noteText = `RESCHEDULE requested by ${authorName}: ${reason}`;
    const withAuthor = await sb
      .from("service_request_notes")
      .insert([{ request_id: id, text: noteText, author_id: uid }])
      .select("id")
      .single();

    if (withAuthor.error) {
      const msg = (withAuthor.error.message || "").toLowerCase();
      if (msg.includes("author_id") || msg.includes("column")) {
        await sb.from("service_request_notes").insert([{ request_id: id, text: noteText }]);
      }
    }

    return NextResponse.json({
      ok: true,
      row: {
        id: data.id,
        status: data.status,
        scheduled_at: data.scheduled_at,
        technician_id: data.technician_id,
        dispatch_notes: data.dispatch_notes ?? null,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
