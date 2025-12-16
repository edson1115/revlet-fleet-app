// app/api/office/dashboard/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await supabaseServer();

    /* -------------------------------------------
       AUTH
    ------------------------------------------- */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = normalizeRole(user.user_metadata?.role);
    const ALLOWED = new Set([
      "OFFICE",
      "DISPATCH",
      "ADMIN",
      "SUPERADMIN",
    ]);

    if (!role || !ALLOWED.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* -------------------------------------------
       PROFILE → MARKET
    ------------------------------------------- */
    const { data: profile } = await supabase
      .from("profiles")
      .select("active_market")
      .eq("id", user.id)
      .maybeSingle();

    const market = profile?.active_market;
    if (!market) {
      return NextResponse.json(
        { error: "No active market assigned" },
        { status: 400 }
      );
    }

    /* -------------------------------------------
       COUNTS BY STATUS
    ------------------------------------------- */
    async function count(status: string) {
      const { count } = await supabase
        .from("service_requests")
        .select("*", { count: "exact", head: true })
        .eq("market", market)
        .eq("status", status);

      return count ?? 0;
    }

    const [
      waiting,
      toBeScheduled,
      scheduled,
      inProgress,
      completed,
    ] = await Promise.all([
      count("WAITING"),
      count("TO_BE_SCHEDULED"),
      count("SCHEDULED"),
      count("IN_PROGRESS"),
      count("COMPLETED"),
    ]);

    const openRequests =
      waiting + toBeScheduled + scheduled + inProgress;

    /* -------------------------------------------
       URGENT
    ------------------------------------------- */
    const { count: urgent } = await supabase
      .from("service_requests")
      .select("*", { count: "exact", head: true })
      .eq("market", market)
      .eq("urgent", true)
      .neq("status", "COMPLETED");

    /* -------------------------------------------
       TODAY’S SCHEDULE
    ------------------------------------------- */
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const { data: today } = await supabase
      .from("service_requests")
      .select(
        `
        id,
        service,
        scheduled_start_at,
        vehicle:vehicles (
          year,
          make,
          model
        )
      `
      )
      .eq("market", market)
      .eq("status", "SCHEDULED")
      .gte("scheduled_start_at", start.toISOString())
      .lte("scheduled_start_at", end.toISOString())
      .order("scheduled_start_at", { ascending: true });

    /* -------------------------------------------
       RESPONSE
    ------------------------------------------- */
    return NextResponse.json({
      open_requests: openRequests,
      waiting,
      to_be_scheduled: toBeScheduled,
      scheduled,
      in_progress: inProgress,
      completed,
      urgent: urgent ?? 0,
      today: today ?? [],
    });
  } catch (err: any) {
    console.error("Office dashboard error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
