// app/api/schedule/set/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

/**
 * POST /api/schedule/set
 *
 * Body:
 * {
 *   request_id: string,
 *   technician_id: string | null,
 *   scheduled_at: string | null,
 *   scheduled_end_at: string | null
 * }
 *
 * Updates:
 * - service_requests (scheduled_at, scheduled_end_at, technician_id)
 * - schedule_blocks
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    if (!scope.uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { request_id, technician_id, scheduled_at, scheduled_end_at } = body;

    if (!request_id) {
      return NextResponse.json(
        { error: "request_id_required" },
        { status: 400 }
      );
    }

    // -----------------------------------------------------
    // Load request first
    // -----------------------------------------------------
    const { data: reqRow, error: reqErr } = await supabase
      .from("service_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (reqErr || !reqRow) {
      return NextResponse.json(
        { error: "request_not_found" },
        { status: 404 }
      );
    }

    // -----------------------------------------------------
    // RBAC
    // -----------------------------------------------------
    if (scope.isTech && reqRow.technician_id !== scope.uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // -----------------------------------------------------
    // Update service request
    // -----------------------------------------------------
    const updatePayload: any = {
      technician_id: technician_id || null,
      scheduled_at: scheduled_at || null,
      scheduled_end_at: scheduled_end_at || null,
    };

    // If no window → status returns to WAITING
    if (!scheduled_at) {
      updatePayload.status = "WAITING_TO_BE_SCHEDULED";
    } else {
      updatePayload.status = "SCHEDULED";
    }

    const { error: upErr } = await supabase
      .from("service_requests")
      .update(updatePayload)
      .eq("id", request_id);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }

    // -----------------------------------------------------
    // Schedule Blocks — Remove old → Insert new
    // -----------------------------------------------------
    // Remove existing blocks
    await supabase
      .from("schedule_blocks")
      .delete()
      .eq("request_id", request_id);

    // Insert new block if scheduled_at exists
    if (technician_id && scheduled_at) {
      const blockInsert = {
        request_id: request_id,
        technician_id,
        start_at: scheduled_at,
        end_at: scheduled_end_at ?? scheduled_at, // fallback to start
      };

      const { error: blkErr } = await supabase
        .from("schedule_blocks")
        .insert(blockInsert);

      if (blkErr) {
        return NextResponse.json({ error: blkErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("schedule/set failed:", err);
    return NextResponse.json(
      { error: err?.message || "failed" },
      { status: 500 }
    );
  }
}
