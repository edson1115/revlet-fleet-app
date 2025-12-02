// app/api/schedule/tech/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

/**
 * GET /api/schedule/tech?tech_id=xxx
 *
 * Returns:
 * {
 *   technician_id: string,
 *   blocks: [
 *     { start_at: string, end_at: string }
 *   ]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tech_id = url.searchParams.get("tech_id");

    if (!tech_id) {
      return NextResponse.json(
        { error: "Missing tech_id" },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    if (!scope.uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // -------------------------------------------------------
    // Permission checks
    // -------------------------------------------------------
    if (scope.isCustomer) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (scope.isTech && scope.uid !== tech_id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // INTERNAL: validate technician is inside allowed markets
    if (scope.isInternal && !scope.isSuper) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, market")
        .eq("id", tech_id)
        .maybeSingle();

      if (!profile) {
        return NextResponse.json(
          { error: "technician_not_found" },
          { status: 404 }
        );
      }

      if (!scope.markets.includes(profile.market)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    // -------------------------------------------------------
    // Fetch technician's schedule blocks
    // -------------------------------------------------------
    const { data: blocks, error } = await supabase
      .from("schedule_blocks")
      .select("start_at, end_at")
      .eq("technician_id", tech_id)
      .order("start_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      technician_id: tech_id,
      blocks: blocks || [],
    });
  } catch (e: any) {
    console.error("/api/schedule/tech error", e);
    return NextResponse.json(
      { error: e?.message || "failed" },
      { status: 500 }
    );
  }
}
