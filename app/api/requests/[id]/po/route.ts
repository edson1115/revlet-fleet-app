// app/api/requests/[id]/po/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

export async function PATCH(req: Request, ctx: { params: Promise<Params> }) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      po?: string | null;
      notes?: string | null;
    };

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (body.hasOwnProperty("po")) updates.po = body.po ?? null;
    if (body.hasOwnProperty("notes")) updates.notes = body.notes ?? null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const supabase = await supabaseServer();
    const { error } = await supabase
      .from("service_requests")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
