// app/api/requests/schedule/route.ts

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, technician_id, scheduled_at, company_id, isAdmin, notes } = body;

    if (!id || !technician_id || !scheduled_at) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ⭐ NEW API — always use await supabaseServer()
    const sb = await supabaseServer();

    // ───────────────────────────────────────────
    // 1. LOAD REQUEST (scoped if not admin)
    // ───────────────────────────────────────────
    let sel = sb
      .from("service_requests")
      .select("id, dispatch_notes, company_id")
      .eq("id", id);

    if (!isAdmin && company_id) {
      sel = sel.eq("company_id", company_id);
    }

    const { data: current, error: curErr } = await sel.single();

    if (curErr || !current) {
      return NextResponse.json(
        { error: curErr?.message || "not_found" },
        { status: 404 }
      );
    }

    // ───────────────────────────────────────────
    // 2. Append dispatch log
    // ───────────────────────────────────────────
    const ts = new Date().toLocaleString();
    const logLine = `[${ts}] Scheduled with tech ${technician_id} at ${scheduled_at}${
      notes ? ` — ${notes}` : ""
    }`;

    const newNotes = current.dispatch_notes
      ? `${current.dispatch_notes}\n${logLine}`
      : logLine;

    // ───────────────────────────────────────────
    // 3. UPDATE REQUEST
    // ───────────────────────────────────────────
    const { error: updErr } = await sb
      .from("service_requests")
      .update({
        technician_id,
        scheduled_at,
        status: "SCHEDULED",
        dispatch_notes: newNotes,
      })
      .eq("id", id);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("schedule-error:", err);
    return NextResponse.json(
      { error: err?.message || "server_error" },
      { status: 500 }
    );
  }
}
