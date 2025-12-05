import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer();

    // AUTH
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = normalizeRole(user.user_metadata?.role);

    const scope = req.nextUrl.searchParams.get("scope");
    const vehicleId = req.nextUrl.searchParams.get("vehicle");
    const customerFilter = req.nextUrl.searchParams.get("customer");

    // -----------------------------------------------------
    // BASE QUERY
    // -----------------------------------------------------
    let query = supabase
      .from("requests")
      .select(
        `
        id,
        customer_id,
        vehicle_id,
        service,
        notes,
        status,
        date_requested,
        created_at,
        scheduled_start_at,
        scheduled_end_at,
        started_at,
        completed_at,

        assigned_tech:assigned_tech(
          id,
          full_name
        ),

        vehicle:vehicle_id (
          id,
          year,
          make,
          model,
          plate,
          vin
        )
      `
      )
      .order("created_at", { ascending: false });

    // -----------------------------------------------------
    // FILTER: BY VEHICLE
    // -----------------------------------------------------
    if (vehicleId) {
      query = query.eq("vehicle_id", vehicleId);
    }

    // -----------------------------------------------------
    // FILTER: CUSTOMER-SPECIFIC VIEW (FM/Office)
    // /api/requests?customer=<id>
    // -----------------------------------------------------
    if (customerFilter) {
      query = query.eq("customer_id", customerFilter);
    }

    // -----------------------------------------------------
    // FILTER: CUSTOMER SELF-SCOPE
    // /api/requests?scope=customer
    // -----------------------------------------------------
    if (scope === "customer" && role === "CUSTOMER") {
      // Lookup the customer row for logged-in user
      const { data: customerRow } = await supabase
        .from("customers")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!customerRow) {
        return NextResponse.json({ rows: [] });
      }

      query = query.eq("customer_id", customerRow.id);
    }

    // -----------------------------------------------------
    // RUN QUERY
    // -----------------------------------------------------
    const { data, error } = await query;

    if (error) {
      console.error("REQUEST FETCH ERROR:", error);
      return NextResponse.json({ error: "Failed loading requests" }, { status: 500 });
    }

    return NextResponse.json({ rows: data ?? [] });
  } catch (err: any) {
    console.error("REQUESTS API ERROR:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}



