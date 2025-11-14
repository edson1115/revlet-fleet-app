// app/api/portal/maintenance/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await supabaseServer();

  // Get logged-in user
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;

  if (!uid) {
    return NextResponse.json({ rows: [] });
  }

  // Get user's customer_id
  const { data: prof } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", uid)
    .maybeSingle();

  if (!prof?.customer_id) {
    return NextResponse.json({ rows: [] });
  }

  const customerId = prof.customer_id;

  // Pull vehicles + last PM (oil change)
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("customer_id", customerId);

  const { data: pmHistory } = await supabase
    .from("service_requests")
    .select("vehicle_id, mileage, created_at, service")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  const rows = vehicles.map((v) => {
    const pm = pmHistory.find((x) =>
      String(x.service || "").toLowerCase().includes("oil")
    );

    const lastPmMileage = pm?.mileage ?? null;

    const nextPmMileage =
      lastPmMileage !== null ? lastPmMileage + 5000 : null;

    let status: "OVERDUE" | "DUE_SOON" | "GOOD" | "MISSING" = "GOOD";

    if (!v.mileage) status = "MISSING";
    else if (!lastPmMileage) status = "MISSING";
    else if (v.mileage > nextPmMileage!) status = "OVERDUE";
    else if (v.mileage + 500 >= nextPmMileage!) status = "DUE_SOON";

    return {
      vehicle_id: v.id,
      unit_number: v.unit_number,
      year: v.year,
      make: v.make,
      model: v.model,
      plate: v.plate,
      mileage: v.mileage,
      last_pm_mileage: lastPmMileage,
      next_pm_mileage: nextPmMileage,
      status,
    };
  });

  return NextResponse.json({ rows });
}
