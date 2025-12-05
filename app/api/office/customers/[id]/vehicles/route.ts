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

    // VEHICLE LIST
    const { data: vehicles, error } = await supabase
      .from("vehicles")
      .select(
        `
        id,
        customer_id,
        year,
        make,
        model,
        plate,
        vin,
        unit_number,
        status,
        market,
        created_at
      `
      )
      .eq("customer_id", customerId)
      .order("unit_number", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to load vehicles" },
        { status: 500 }
      );
    }

    // REQUEST COUNTS FOR EACH VEHICLE
    const { data: requests } = await supabase
      .from("service_requests")
      .select("id, vehicle_id, status, created_at");

    // map → attach request counts
    const enriched = vehicles.map((v) => {
      const r = requests.filter((r) => r.vehicle_id === v.id);

      return {
        ...v,
        total_requests: r.length,
        open_requests: r.filter((x) => x.status !== "COMPLETED").length,
      };
    });

    return NextResponse.json({ vehicles: enriched });
  } catch (err: any) {
    console.error("Customer vehicles error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
