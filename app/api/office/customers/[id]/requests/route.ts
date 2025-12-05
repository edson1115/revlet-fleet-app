import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, { params }: any) {
  try {
    const supabase = await supabaseServer();

    const customerId = params.id;

    // AUTH
    const {
      data: { user }
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
      "FLEET_MANAGER"
    ]);

    if (!role || !ALLOWED.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // REQUEST LIST
    const { data: requests, error } = await supabase
      .from("service_requests")
      .select(
        `
        id,
        status,
        service,
        created_at,
        scheduled_start_at,
        vehicle:vehicle_id (
          id,
          year,
          make,
          model,
          plate,
          unit_number
        ),
        tech:technician_id (
          id,
          full_name
        )
      `
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to load requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: requests ?? [] });
  } catch (err: any) {
    console.error("Customer requests error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
