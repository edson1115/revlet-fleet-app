// app/api/schedule/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

/*
  Expected body: { request_id: string }
*/

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const scope = await resolveUserScope();

  if (!scope.uid)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!scope.isSuper && scope.role !== "DISPATCH" && scope.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { request_id } = body;

  if (!request_id)
    return NextResponse.json({ error: "missing_request_id" }, { status: 400 });

  // Market enforcement
  const { data: existing, error: exErr } = await supabase
    .from("service_requests")
    .select("id, market")
    .eq("id", request_id)
    .maybeSingle();

  if (exErr || !existing)
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (scope.isInternal) {
    if (!scope.markets.includes(existing.market)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  /* ============================
     Delete schedule_blocks entry
  ============================= */
  const { error: delErr } = await supabase
    .from("schedule_blocks")
    .delete()
    .eq("request_id", request_id);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  /* ============================
     Reset request scheduling info
  ============================= */
  const { data: updated, error: updErr } = await supabase
    .from("service_requests")
    .update({
      status: "WAITING_TO_BE_SCHEDULED",
      technician_id: null,
      scheduled_at: null,
      scheduled_end_at: null,
    })
    .eq("id", request_id)
    .select("*")
    .single();

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, request: updated });
}
