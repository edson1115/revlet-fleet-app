// app/api/requests/[id]/complete/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

async function getStatus(id: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("service_requests")
    .select("status, scheduled_at, started_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Not found");
  return { supabase, row: data as { status: string; scheduled_at: string | null; started_at: string | null } };
}

export async function PATCH(_req: Request, ctx: { params: Promise<Params> }) {
  try {
    const { id } = await ctx.params;

    // 1) Read current state
    const { supabase, row } = await getStatus(id);
    const nowIso = new Date().toISOString();

    // 2) If already completed, no-op
    if (row.status === "COMPLETED") {
      return NextResponse.json({ ok: true });
    }

    // 3) Auto-walk through legal steps if your DB requires it
    // NEW/WAITING_APPROVAL/WAITING_PARTS/DECLINED -> SCHEDULED
    const officeStates = new Set(["NEW", "WAITING_APPROVAL", "WAITING_PARTS", "DECLINED"]);
    if (officeStates.has(row.status)) {
      const { error } = await supabase
        .from("service_requests")
        .update({
          status: "SCHEDULED",
          scheduled_at: row.scheduled_at ?? nowIso,
        })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      row.status = "SCHEDULED";
    }

    // SCHEDULED -> IN_PROGRESS
    if (row.status === "SCHEDULED") {
      const { error } = await supabase
        .from("service_requests")
        .update({
          status: "IN_PROGRESS",
          started_at: row.started_at ?? nowIso,
        })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      row.status = "IN_PROGRESS";
    }

    // IN_PROGRESS -> COMPLETED
    if (row.status === "IN_PROGRESS") {
      const { error } = await supabase
        .from("service_requests")
        .update({
          status: "COMPLETED",
          completed_at: nowIso,
        })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    // Fallback: if anything unexpected remains, force-complete
    const { error: forceErr } = await supabase
      .from("service_requests")
      .update({ status: "COMPLETED", completed_at: nowIso })
      .eq("id", id);
    if (forceErr) return NextResponse.json({ error: forceErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
