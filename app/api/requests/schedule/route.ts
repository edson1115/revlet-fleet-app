// app/api/requests/schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

async function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const jar = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      get: (name: string) => jar.get(name)?.value,
      set: (name: string, value: string, opts: any) => jar.set({ name, value, ...opts }),
      remove: (name: string, opts: any) => jar.set({ name, value: "", ...opts }),
    },
  });
}

function normalizeIso(input: string | null | undefined): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * POST /api/requests/schedule
 * Body: { id: string, technician_id?: string|null, scheduled_at?: string|null }
 * Behavior:
 *   - Sets technician_id and scheduled_at.
 *   - If both technician_id and scheduled_at are present → status = SCHEDULED.
 *   - If technician is missing but date present → status = RESCHEDULE.
 *   - If both missing → no status change.
 */
export async function POST(req: NextRequest) {
  try {
    const sb = await supa();
    const body = await req.json().catch(() => ({} as any));

    const id = String(body?.id || "").trim();
    if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

    const technician_id =
      typeof body?.technician_id === "string" ? (body.technician_id || null) : body?.technician_id ?? undefined;

    const scheduled_at = normalizeIso(body?.scheduled_at ?? null);

    const patch: Record<string, any> = {};
    if (typeof technician_id !== "undefined") patch.technician_id = technician_id;
    if (typeof scheduled_at !== "undefined") patch.scheduled_at = scheduled_at;

    // Decide status only when we have enough info to be definitive.
    if (typeof technician_id !== "undefined" || typeof scheduled_at !== "undefined") {
      if (technician_id && scheduled_at) {
        patch.status = "SCHEDULED";
      } else if (scheduled_at && !technician_id) {
        patch.status = "RESCHEDULE";
      }
      // if neither provided, don't touch status
    }

    const { data, error } = await sb
      .from("service_requests")
      .update(patch)
      .eq("id", id)
      .select("id, status, technician_id, scheduled_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({
      ok: true,
      row: data,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "schedule_failed" }, { status: 400 });
  }
}
