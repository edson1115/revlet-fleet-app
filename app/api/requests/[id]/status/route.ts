// app/api/requests/[id]/status/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { UI_TO_DB_STATUS } from "@/lib/status";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Blindly set status (no transition validation)
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const supabase = await supabaseServer();

    const body = await req.json().catch(() => ({} as any));
    const nextStatusRaw: string | undefined = body?.status;
    const nextStatus =
      nextStatusRaw ? (UI_TO_DB_STATUS[nextStatusRaw.toUpperCase()] ?? nextStatusRaw) : null;

    if (!nextStatus) {
      return NextResponse.json({ error: "missing_status" }, { status: 400 });
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // Optional: scope by company unless ADMIN (we already handle that elsewhere; keep it simple here)
    const { error } = await supabase
      .from("service_requests")
      .update({ status: nextStatus })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
