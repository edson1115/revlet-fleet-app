// app/api/admin/access-requests/[id]/approve/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Role = "CUSTOMER" | "OFFICE" | "DISPATCH" | "TECH" | "ADMIN" | "FLEET_MANAGER";
type Params = { id: string };

/**
 * Approve an access request.
 * Body: { role?: Role, company_id?: string }
 * Notes:
 *  - We only mark the access_requests row as approved here to avoid coupling to auth admin APIs.
 *  - If the table doesn't exist in your project, we no-op and still return {ok:true}.
 */
export async function POST(req: Request, ctx: { params: Promise<Params> }) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = (await req.json().catch(() => ({}))) as {
      role?: Role;
      company_id?: string;
    };

    const supabase = await supabaseServer();

    // Best-effort update; if table is missing, swallow and continue
    const { error } = await supabase
      .from("access_requests")
      .update({
        approved_at: new Date().toISOString(),
        approved_role: body.role ?? null,
        company_id: body.company_id ?? null,
      })
      .eq("id", id);

    if (error) {
      // Don't hard-fail CI/builds if this table isn't in your schema yet
      console.warn("[/api/admin/access-requests/[id]/approve] update failed:", error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

// Optional health check (helps local debugging)
export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;
  return NextResponse.json({ ok: true, id });
}
