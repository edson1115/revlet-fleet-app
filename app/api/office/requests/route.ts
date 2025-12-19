import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ============================================================
   POST — Create service request (Office / Walk-In)
============================================================ */
export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const body = await req.json();

    const {
      customer_id,
      vehicle_id,
      urgent = false,
    } = body;

    if (!customer_id || !vehicle_id) {
      return NextResponse.json(
        { error: "Missing customer or vehicle" },
        { status: 400 }
      );
    }

    /* ---------------- AUTH ---------------- */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = normalizeRole(user.user_metadata?.role);
    const ALLOWED = new Set([
      "OFFICE",
      "ADMIN",
      "SUPERADMIN",
    ]);

    if (!role || !ALLOWED.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* ---------------- CREATE REQUEST ---------------- */
    const { data: request, error } = await supabase
      .from("service_requests")
      .insert({
        customer_id,
        vehicle_id,
        status: "NEW",
        urgent,
        created_by_role: role,
      })
      .select()
      .maybeSingle();

    if (error || !request) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to create request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      request_id: request.id,
    });
  } catch (err: any) {
    console.error("Office create request error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
