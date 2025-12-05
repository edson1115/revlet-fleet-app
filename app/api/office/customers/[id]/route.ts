import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, { params }: any) {
  try {
    const supabase = await supabaseServer();

    const customerId = params.id;

    // Auth
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
      "FLEET_MANAGER",
    ]);

    if (!role || !ALLOWED.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Main customer record
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .select(
        `
        id,
        name,
        address,
        approval_type,
        billing_contact,
        grade,
        notes,
        created_at,
        market
      `
      )
      .eq("id", customerId)
      .maybeSingle();

    if (custErr || !customer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Count vehicles
    const { count: vehicleCount } = await supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", customerId);

    // Count open requests
    const { count: openRequests } = await supabase
      .from("service_requests")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .neq("status", "COMPLETED");

    return NextResponse.json({
      customer,
      stats: {
        vehicles: vehicleCount ?? 0,
        openRequests: openRequests ?? 0,
      },
    });
  } catch (err: any) {
    console.error("Customer detail error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
