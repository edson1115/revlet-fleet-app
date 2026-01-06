import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * POST /api/dispatch/update-status
 * Body:
 * {
 * id: string,
 * status: "READY_TO_SCHEDULE" | "SCHEDULED" | "IN_PROGRESS"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const requestId = String(body.id || "");
    const status = String(body.status || "");

    if (!requestId) {
      return NextResponse.json(
        { error: "Missing request id" },
        { status: 400 }
      );
    }

    const ALLOWED_STATUSES = [
      "READY_TO_SCHEDULE",
      "SCHEDULED",
      "IN_PROGRESS",
    ];

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status: ${status}` },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();

    // 🔐 Auth check
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 👉 ROLE CHECK: Role-scoped control
    const role = user.user_metadata?.role;
    if (!["DISPATCH", "TECH"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ Update status only
    const { data, error } = await supabase
      .from("service_requests")
      .update({ status })
      .eq("id", requestId)
      .select()
      .single();

    if (error) {
      console.error("[dispatch/update-status]", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      request: data,
    });
  } catch (e: any) {
    console.error("[dispatch/update-status] fatal", e);
    return NextResponse.json(
      { error: e?.message || "Failed to update status" },
      { status: 500 }
    );
  }
}