// app/api/requests/[id]/schedule/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type Params = { id: string };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/requests/:id/schedule
 * Body:
 *  - scheduled_at?: string | null (ISO)
 *  - technician_id?: string | null
 *
 * Behavior:
 *  - If current status is NEW/WAITING_*/DECLINED -> set to SCHEDULED and stamp scheduled_at (if provided)
 *  - If already SCHEDULED -> just update scheduled_at/technician_id
 *  - If IN_PROGRESS/COMPLETED -> only allow updating technician_id (optional; adjust to taste)
 */
export async function PATCH(req: Request, ctx: { params: Promise<Params> }) {
  try {
    const { id } = await ctx.params;
    const sb = await supabaseServer();
    const body = await req.json().catch(() => ({}));
    const scheduled_at: string | null | undefined = body.scheduled_at ?? null;
    const technician_id: string | null | undefined = body.technician_id;

    // read current
    const { data: row, error: readErr } = await sb
      .from("service_requests")
      .select("status, scheduled_at, technician_id")
      .eq("id", id)
      .maybeSingle();
    if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const officeStates = new Set(["NEW", "WAITING_APPROVAL", "WAITING_PARTS", "DECLINED"]);
    const patch: Record<string, any> = {};

    if (scheduled_at !== undefined) patch.scheduled_at = scheduled_at;
    if (technician_id !== undefined) patch.technician_id = technician_id;

    if (officeStates.has(row.status)) {
      patch.status = "SCHEDULED";
      if (patch.scheduled_at == null) patch.scheduled_at = new Date().toISOString();
    }

    // Optional rule: don’t change scheduled_at if already IN_PROGRESS/COMPLETED
    if ((row.status === "IN_PROGRESS" || row.status === "COMPLETED") && "scheduled_at" in patch) {
      delete patch.scheduled_at;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const { error: updErr } = await sb.from("service_requests").update(patch).eq("id", id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
