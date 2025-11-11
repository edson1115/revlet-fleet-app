// app/api/requests/batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

async function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  const jar = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      get: (name: string) => jar.get(name)?.value,
      set: (name: string, value: string, opts: any) =>
        jar.set({ name, value, ...opts }),
      remove: (name: string, opts: any) =>
        jar.set({ name, value: "", ...opts }),
    },
  });
}

type OpBody =
  | {
      op: "status";
      ids: string[];
      status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "RESCHEDULE";
    }
  | {
      op: "reschedule";
      ids: string[];
      scheduled_at: string;
      status?: "RESCHEDULE";
      note?: string;
    }
  | {
      op: "complete";
      ids: string[];
      note?: string;
    }
  | {
      op: "assign";
      ids: string[];
      technician_id?: string | null;
      scheduled_at?: string | null;
      status?: "SCHEDULED";
    }
  | {
      op: "notes";
      ids: string[];
      dispatch_notes: string | null;
    }
  | {
      op: "return_to_dispatch";
      ids: string[];
      note?: string;
    };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as OpBody;
    const sb = await supa();

    if (!body || !("op" in body)) {
      return NextResponse.json({ error: "Missing op" }, { status: 400 });
    }

    const ids = (body as any).ids as string[] | undefined;
    if (!ids?.length) {
      return NextResponse.json({ error: "Missing ids" }, { status: 400 });
    }

    const nowIso = new Date().toISOString();

    /* =======================
       op: status
       ======================= */
    if (body.op === "status") {
      const patch: any = { status: body.status };
      if (body.status === "IN_PROGRESS") patch.started_at = nowIso;
      if (body.status === "COMPLETED") patch.completed_at = nowIso;

      const { error } = await sb
        .from("service_requests")
        .update(patch)
        .in("id", ids);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    /* =======================
       op: reschedule (Dispatch)
       ======================= */
    if (body.op === "reschedule") {
      const patch: any = {
        scheduled_at: body.scheduled_at,
        status: body.status || "RESCHEDULE",
      };

      if (body.note && body.note.trim()) {
        patch.notes = body.note.trim();
      }

      const { error } = await sb
        .from("service_requests")
        .update(patch)
        .in("id", ids);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    /* =======================
       op: complete (Tech)
       ======================= */
    if (body.op === "complete") {
      const patch: any = {
        status: "COMPLETED",
        completed_at: nowIso,
      };

      if (body.note && body.note.trim()) {
        // Treat as "Notes from Tech" / completion notes for now.
        patch.notes = body.note.trim();
      }

      const { error } = await sb
        .from("service_requests")
        .update(patch)
        .in("id", ids);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    /* =======================
       op: assign (Dispatch)
       ======================= */
    if (body.op === "assign") {
      const patch: any = {};

      if (typeof body.technician_id !== "undefined") {
        patch.technician_id = body.technician_id;
      }
      if (typeof body.scheduled_at !== "undefined") {
        patch.scheduled_at = body.scheduled_at;
      }

      patch.status = body.status || "SCHEDULED";

      const { error } = await sb
        .from("service_requests")
        .update(patch)
        .in("id", ids);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    /* =======================
       op: notes (Dispatch inline)
       ======================= */
    if (body.op === "notes") {
      const patch: any = {
        dispatch_notes: body.dispatch_notes ?? null,
      };

      const { error } = await sb
        .from("service_requests")
        .update(patch)
        .in("id", ids);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    /* =======================
       op: return_to_dispatch (Tech)
       - Unassign tech
       - Clear scheduled_at
       - Set status → RESCHEDULE
       - Record a visible note
       ======================= */
        /* =======================
       op: return_to_dispatch (Tech)
       - Unassign tech
       - Clear scheduled_at
       - Set status → RESCHEDULE
       - Append a visible note for Dispatch/Office
       ======================= */
    if (body.op === "return_to_dispatch") {
      const raw = (body.note ?? "").toString().trim();
      const msgBase = raw || "Sent back by Tech (no reason provided).";

      // 1) Load existing dispatch_notes so we can append instead of overwrite
      const { data: existing, error: loadErr } = await sb
        .from("service_requests")
        .select("id, dispatch_notes")
        .in("id", ids);

      if (loadErr) throw new Error(loadErr.message);

      // Build per-row new dispatch_notes
      const patchRows = (existing || []).map((row) => {
        const prev = row.dispatch_notes?.toString().trim();
        const combined = prev
          ? `${prev}\n${msgBase}`
          : msgBase;

        return {
          id: row.id,
          status: "RESCHEDULE",
          technician_id: null,
          scheduled_at: null,
          dispatch_notes: combined,
        };
      });

      // Safety: if for some reason select returned nothing, still run a generic update
      if (!patchRows.length) {
        const { error } = await sb
          .from("service_requests")
          .update({
            status: "RESCHEDULE",
            technician_id: null,
            scheduled_at: null,
            dispatch_notes: msgBase,
          })
          .in("id", ids);

        if (error) throw new Error(error.message);
      } else {
        // 2) Apply row-specific updates
        const { error: upErr } = await sb
          .from("service_requests")
          .upsert(patchRows, { onConflict: "id" }); // update matching ids

        if (upErr) throw new Error(upErr.message);
      }

      // 3) Also log into service_request_notes for Office drawer history
      try {
        await sb.from("service_request_notes").insert(
          ids.map((id) => ({
            request_id: id,
            text: `Sent back by Tech: ${msgBase}`,
          }))
        );
      } catch {
        // non-fatal
      }

      return NextResponse.json({ ok: true });
    }


    return NextResponse.json({ error: "Unsupported op" }, { status: 400 });
  } catch (e: any) {
    console.error("Batch error", e);
    return NextResponse.json(
      { error: e?.message || "Batch failed" },
      { status: 400 }
    );
  }
}
