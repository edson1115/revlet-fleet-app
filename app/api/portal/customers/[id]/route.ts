// app/api/portal/customers/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/permissions";

export async function GET(req: Request) {
  try {
    const supabase = await supabaseServer();
    const url = new URL(req.url);
    const customerId = url.pathname.split("/").pop();

    // Auth
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = normalizeRole(user.user_metadata?.role);
    const isInternal =
      role &&
      ["OFFICE", "SUPERADMIN", "ADMIN", "DISPATCH", "FLEET_MANAGER"].includes(
        role
      );

    if (!isInternal)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // ----------------------------------------
    // 1. Customer
    // ----------------------------------------
    const { data: customer } = await supabase
      .from("customers")
      .select("id, name, address, approval_type, billing_contact, billing_email, billing_phone, notes")
      .eq("id", customerId)
      .maybeSingle();

    if (!customer)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // ----------------------------------------
    // 2. Recent Requests
    // ----------------------------------------
    const { data: recent_requests } = await supabase
      .from("requests")
      .select(
        `
        id, status, service, notes, created_at, date_requested,
        vehicle:vehicle_id (id, year, make, model, plate, vin)
      `
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(20);

    // ----------------------------------------
    // 3. Fleet Metrics
    // ----------------------------------------
    const { count: totalVehicles } = await supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", customerId);

    const { count: openRequests } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .neq("status", "COMPLETED");

    // Fake formula for now
    const grade = totalVehicles && openRequests !== null
      ? openRequests === 0
        ? "A+"
        : openRequests < totalVehicles / 2
        ? "B"
        : "C"
      : "N/A";

    const daysSinceLastInspection = 17; // placeholder until inspection table exists

    return NextResponse.json({
      customer,
      recent_requests: recent_requests || [],
      fleet: {
        totalVehicles: totalVehicles || 0,
        openRequests: openRequests || 0,
        daysSinceLastInspection,
        grade,
      },
    });
  } catch (err: any) {
    console.error("CUSTOMER PORTAL ERROR:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
