// app/api/requests/[id]/schedule/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

export async function PATCH(req: Request, ctx: { params: Promise<Params> }) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      scheduled_at: string;       // ISO string (required)
      request_techs?: string[];   // optional tech IDs
    };

    if (!body?.scheduled_at) {
      return NextResponse.json({ error: "scheduled_at is required" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    // Move to SCHEDULED + set schedule/techs
    const updates: Record<string, any> = {
      status: "SCHEDULED",
      scheduled_at: body.scheduled_at,
    };
    if (Array.isArray(body.request_techs)) updates.request_techs = body.request_techs;

    const { error } = await supabase
      .from("service_requests")
      .update(updates)
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, status: "SCHEDULED" });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
