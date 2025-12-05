// app/api/schedule/block/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

/**
 * POST → create/update schedule block for a request.
 * Body:
 * {
 *   request_id: string;
 *   technician_id: string;
 *   start_at: string (ISO);
 *   end_at: string (ISO);
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    if (!scope.uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const { request_id, technician_id, start_at, end_at } = body;

    if (!request_id || !technician_id || !start_at || !end_at) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    // ------------------------------------------------------------
    // Permission Logic
    // ------------------------------------------------------------

    if (scope.isCustomer) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (scope.isTech && scope.uid !== technician_id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Dispatch, Office, Admin, SuperAdmin allowed

    // ------------------------------------------------------------
    // Upsert rule:
    // Each request has max 1 schedule block.
    // ------------------------------------------------------------
    const { data: existing } = await supabase
      .from("schedule_blocks")
      .select("id")
      .eq("request_id", request_id)
      .maybeSingle();

    const blockData = {
      request_id,
      technician_id,
      start_at,
      end_at,
    };

    let dbRes;
    if (existing?.id) {
      // update
      dbRes = await supabase
        .from("schedule_blocks")
        .update(blockData)
        .eq("id", existing.id)
        .select("*")
        .single();
    } else {
      // insert
      dbRes = await supabase
        .from("schedule_blocks")
        .insert(blockData)
        .select("*")
        .single();
    }

    if (dbRes.error) {
      return NextResponse.json(
        { error: dbRes.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, block: dbRes.data });
  } catch (e: any) {
    console.error("schedule/block error:", e);
    return NextResponse.json(
      { error: e?.message || "failed" },
      { status: 500 }
    );
  }
}



