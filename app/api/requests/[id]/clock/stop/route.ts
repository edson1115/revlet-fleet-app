// app/api/requests/[id]/clock/stop/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { id: string };
type RouteContext = { params: Promise<Params> };

export async function PATCH(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await supabaseServer();

  // 1) Fetch existing clock data
  const { data: existing, error: fetchErr } = await supabase
    .from("requests")
    .select("clock_started_at")
    .eq("id", id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json(
      { error: "Request not found" },
      { status: 404 }
    );
  }

  const now = new Date().toISOString();

  // 2) Calculate minutes (if clock_started_at exists)
  let laborMinutes: number | null = null;
  if (existing.clock_started_at) {
    const start = new Date(existing.clock_started_at).getTime();
    const stop = Date.now();
    laborMinutes = Math.max(0, Math.round((stop - start) / 60000));
  }

  // 3) Update request
  const { data, error: updateErr } = await supabase
    .from("requests")
    .update({
      clock_stopped_at: now,
      labor_minutes: laborMinutes,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json(
      { error: updateErr.message },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      message: "Clock stopped",
      stopped_at: now,
      labor_minutes: laborMinutes,
      request: data,
    },
    { status: 200 }
  );
}
