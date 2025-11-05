// app/api/requests/batch/route.ts
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

type OpBody =
  | { op: "status"; ids: string[]; status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "RESCHEDULE" }
  | { op: "reschedule"; ids: string[]; scheduled_at: string; status?: "RESCHEDULE"; note?: string }
  | { op: "complete"; ids: string[]; note?: string }
  | { op: "assign"; ids: string[]; technician_id?: string | null; scheduled_at?: string | null; status?: "SCHEDULED" }
  | { op: "notes"; ids: string[]; dispatch_notes: string | null }; // NEW

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as OpBody;
    const sb = await supa();

    if (!body || !("op" in body)) {
      return NextResponse.json({ error: "Missing op" }, { status: 400 });
    }
    const ids = (body as any).ids as string[] | undefined;
    if (!ids?.length) return NextResponse.json({ error: "Missing ids" }, { status: 400 });

    const nowIso = new Date().toISOString();

    if (body.op === "status") {
      const patch: any = { status: body.status };
      if (body.status === "IN_PROGRESS") patch.started_at = nowIso;
      if (body.status === "COMPLETED") patch.completed_at = nowIso;

      const { error } = await sb.from("service_requests").update(patch).in("id", ids);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (body.op === "reschedule") {
      const patch: any = {
        scheduled_at: body.scheduled_at,
        status: body.status || "RESCHEDULE",
      };
      if (body.note) {
        // if you want separate column (e.g. tech_notes), change here
        patch.notes = body.note;
      }
      const { error } = await sb.from("service_requests").update(patch).in("id", ids);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (body.op === "complete") {
      const patch: any = { status: "COMPLETED", completed_at: nowIso };
      if (body.note) patch.notes = body.note;
      const { error } = await sb.from("service_requests").update(patch).in("id", ids);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (body.op === "assign") {
      const patch: any = {};
      if (typeof body.technician_id !== "undefined") patch.technician_id = body.technician_id;
      if (typeof body.scheduled_at !== "undefined") patch.scheduled_at = body.scheduled_at;
      patch.status = body.status || "SCHEDULED";

      const { error } = await sb.from("service_requests").update(patch).in("id", ids);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (body.op === "notes") {
      const patch: any = { dispatch_notes: body.dispatch_notes ?? null };
      const { error } = await sb.from("service_requests").update(patch).in("id", ids);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unsupported op" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Batch failed" }, { status: 400 });
  }
}
