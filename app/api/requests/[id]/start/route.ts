// app/api/requests/[id]/start/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

export async function PATCH(_req: Request, ctx: { params: Promise<Params> }) {
  try {
    const { id } = await ctx.params;
    const supabase = await supabaseServer();

    const { data: row, error: getErr } = await supabase
      .from("service_requests")
      .select("status")
      .eq("id", id)
      .maybeSingle();

    if (getErr) return NextResponse.json({ error: getErr.message }, { status: 500 });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (row.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: `Unsupported status transition: ${row.status} -> IN_PROGRESS` },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("service_requests")
      .update({ status: "IN_PROGRESS", started_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
