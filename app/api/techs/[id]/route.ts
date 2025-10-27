// app/api/technicians/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { id: string };

// PATCH /api/technicians/:id  { full_name?, phone?, email?, active? }
export async function PATCH(req: Request, ctx: { params: Promise<Params> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const patch: Record<string, any> = {};
    if (body.full_name !== undefined) patch.full_name = String(body.full_name).trim() || null;
    if (body.phone !== undefined) patch.phone = body.phone || null;
    if (body.email !== undefined) patch.email = body.email || null;
    if (body.active !== undefined) patch.active = !!body.active;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "no fields" }, { status: 400 });
    }

    const sb = await supabaseServer();
    const { data, error } = await sb
      .from("technicians")
      .update(patch)
      .eq("id", id)
      .select("id, full_name, phone, email, active, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ tech: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}

// DELETE /api/technicians/:id
// Hard delete; if you prefer soft, just PATCH active=false instead.
export async function DELETE(_req: Request, ctx: { params: Promise<Params> }) {
  try {
    const { id } = await ctx.params;
    const sb = await supabaseServer();
    const { error } = await sb.from("technicians").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
