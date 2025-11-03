import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function httpErr(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

// PATCH name/phone/email/active
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const sb = await supabaseServer();
    const body = await req.json().catch(() => ({} as any));

    const patch: any = {};
    if (typeof body.full_name !== "undefined") patch.full_name = body.full_name || null;
    if (typeof body.name !== "undefined") patch.full_name = body.name || null; // also accept `name`
    if (typeof body.phone !== "undefined") patch.phone = body.phone || null;
    if (typeof body.email !== "undefined") patch.email = body.email || null;
    if (typeof body.active !== "undefined") patch.active = !!body.active;

    const { data: auth } = await sb.auth.getUser();
    const uid = auth.user?.id || null;
    if (!uid) return httpErr("unauthorized", 401);

    const { data: me } = await sb.from("profiles").select("company_id").eq("id", uid).maybeSingle();
    const company_id = (me?.company_id as string) || null;
    if (!company_id) return httpErr("no_company", 400);

    const upd = await sb
      .from("technicians")
      .update(patch)
      .eq("id", id)
      .eq("company_id", company_id)
      .select("id, full_name, phone, email, active")
      .maybeSingle();

    if (upd.error) return httpErr(upd.error.message, 500);
    if (!upd.data) return httpErr("not_found", 404);

    return NextResponse.json(upd.data);
  } catch (e: any) {
    return httpErr(e?.message || "update_failed", 500);
  }
}

// DELETE /api/techs/[id]
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const sb = await supabaseServer();

    const { data: auth } = await sb.auth.getUser();
    const uid = auth.user?.id || null;
    if (!uid) return httpErr("unauthorized", 401);

    const { data: me } = await sb.from("profiles").select("company_id").eq("id", uid).maybeSingle();
    const company_id = (me?.company_id as string) || null;
    if (!company_id) return httpErr("no_company", 400);

    const del = await sb.from("technicians").delete().eq("id", id).eq("company_id", company_id);
    if (del.error) return httpErr(del.error.message, 500);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return httpErr(e?.message || "delete_failed", 500);
  }
}
