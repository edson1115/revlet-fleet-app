// app/api/requests/reschedule/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, new_date, new_time, company_id, notes, isAdmin } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    // ⭐ FIX: MUST await supabaseServer()
    const sb = await supabaseServer();

    // ────────────────────────────────────────────────────────────────
    // 1. Load existing dispatch notes (filters first, .single() last)
    // ────────────────────────────────────────────────────────────────
    let sel = sb
      .from("service_requests")
      .select("id, dispatch_notes, company_id")
      .eq("id", id);

    if (!isAdmin && company_id) {
      sel = sel.eq("company_id", company_id);
    }

    const { data: current, error: selErr } = await sel.single();

    if (selErr || !current) {
      return NextResponse.json(
        { error: selErr?.message || "not_found" },
        { status: 404 }
      );
    }

    // ────────────────────────────────────────────────────────────────
    // 2. Append new dispatch note
    // ────────────────────────────────────────────────────────────────
    const ts = new Date().toLocaleString();
    const line = `[${ts}] Rescheduled to ${new_date} ${new_time}${
      notes ? ` — ${notes}` : ""
    }`;

    const newNotes = current.dispatch_notes
      ? `${current.dispatch_notes}\n${line}`
      : line;

    // ────────────────────────────────────────────────────────────────
    // 3. Update service request
    // ────────────────────────────────────────────────────────────────
    const { error: updErr } = await sb
      .from("service_requests")
      .update({
        scheduled_at: `${new_date}T${new_time}:00`,
        dispatch_notes: newNotes,
      })
      .eq("id", id);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("reschedule-error:", err);
    return NextResponse.json(
      { error: err?.message || "server_error" },
      { status: 500 }
    );
  }
}
