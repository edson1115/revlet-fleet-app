import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const scope = await resolveUserScope();

    if (!scope.uid || !scope.isOffice) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await supabaseServer();

    // Load request statuses
    const { data: rows, error } = await supabase
      .from("service_requests")
      .select("status");

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const stats = {
      total: rows.length,
      new: 0,
      waiting: 0,
      scheduled: 0,
      in_progress: 0,
      completed: 0,
    };

    for (const r of rows) {
      switch (r.status) {
        case "NEW":
          stats.new++;
          break;
        case "WAITING":
        case "WAITING_FOR_APPROVAL":
        case "WAITING_FOR_PARTS":
          stats.waiting++;
          break;
        case "SCHEDULED":
          stats.scheduled++;
          break;
        case "IN_PROGRESS":
          stats.in_progress++;
          break;
        case "COMPLETED":
          stats.completed++;
          break;
      }
    }

    return NextResponse.json({
      ok: true,
      stats,
    });
  } catch (e: any) {
    console.error("OFFICE DASHBOARD ERROR:", e);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
