// app/api/dispatch/bulk-schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/* -------------------------------------------------------
   PATCH /api/dispatch/bulk-schedule
   Applies scheduling updates to many requests at once.
------------------------------------------------------- */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { ids, scheduled_at, scheduled_end_at, eta_start, eta_end } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    /* ------------------------------------
       Normalize incoming timestamps
    ------------------------------------ */
    const update: any = { status: "SCHEDULED" };

    if (scheduled_at !== undefined) {
      update.scheduled_at = scheduled_at
        ? new Date(scheduled_at).toISOString()
        : null;
    }

    if (scheduled_end_at !== undefined) {
      update.scheduled_end_at = scheduled_end_at
        ? new Date(scheduled_end_at).toISOString()
        : null;
    }

    if (eta_start !== undefined) {
      update.eta_start = eta_start
        ? new Date(eta_start).toISOString()
        : null;
    }

    if (eta_end !== undefined) {
      update.eta_end = eta_end
        ? new Date(eta_end).toISOString()
        : null;
    }

    /* ------------------------------------
       Apply bulk update
    ------------------------------------ */
    const { error } = await supabase
      .from("service_requests")
      .update(update)
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      count: ids.length,
      applied: update,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed" },
      { status: 500 }
    );
  }
}



