import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

function isSuperAdminEmail(email?: string | null) {
  const envList = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const fallback = "edson.cortes@bigo.com";
  const e = (email || "").toLowerCase();
  return !!e && (envList.includes(e) || e === fallback);
}

async function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const jar = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      get: (name: string) => jar.get(name)?.value,
      set: (name: string, value: string, opts: any) => jar.set({ name, value, ...opts }),
      remove: (name: string, opts: any) => jar.set({ name, value: "", ...opts }),
    },
  });
}

/**
 * POST /api/admin/cleanup
 * Body (optional):
 *   { older_than_days?: number }  // if omitted, deletes ALL COMPLETED
 *
 * Auth:
 *   Superadmin email or role=ADMIN on profiles.
 *
 * Behavior:
 *   - Deletes COMPLETED requests (optionally older than N days).
 *   - If images are ON DELETE CASCADE, nothing else needed.
 *   - Otherwise, you can manually clear images first using SQL once.
 */
export async function POST(req: NextRequest) {
  try {
    const sb = await supa();

    // auth
    const { data: auth } = await sb.auth.getUser();
    const email = auth?.user?.email || null;
    const uid = auth?.user?.id || null;
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    let isAdmin = isSuperAdminEmail(email);
    if (!isAdmin) {
      const { data: me } = await sb
        .from("profiles")
        .select("role")
        .eq("id", uid)
        .maybeSingle();
      if ((me?.role || "").toUpperCase() === "ADMIN") isAdmin = true;
    }
    if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({} as any));
    const olderThanDays = Number(body?.older_than_days);
    const useCutoff = Number.isFinite(olderThanDays) && olderThanDays > 0;
    const cutoffExpr = `now() - interval '${olderThanDays} days'`;

    // Build delete
    let del = sb.from("service_requests").delete().eq("status", "COMPLETED");
    if (useCutoff) {
      // Supabase JS doesn't support SQL expressions in .lt(), so use filter with raw
      del = del.filter("coalesce(completed_at, created_at)", "lt", cutoffExpr as any);
    }

    const { count, error } = await del.select("id", { count: "exact" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({
      ok: true,
      deleted_count: count ?? 0,
      scope: useCutoff ? `COMPLETED older than ${olderThanDays} day(s)` : "all COMPLETED",
      note: "If images are not ON DELETE CASCADE, clear the image table once via SQL."
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "cleanup_failed" }, { status: 400 });
  }
}
