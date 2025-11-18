// app/api/fm/inspections/today/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isoToday = today.toISOString().split("T")[0];

  // 1) Get all recurring inspections due today
  const { data: inspections, error } = await supabase
    .from("recurring_inspections")
    .select(
      `
        id,
        customer_id,
        frequency,
        next_run,
        active,
        customers:customer_id ( name )
      `
    )
    .eq("active", true)
    .eq("next_run", isoToday);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  // Get all vehicle counts per customer
  const customerIds = inspections.map((i) => i.customer_id);

  let vehicleCounts: Record<string, number> = {};

  if (customerIds.length) {
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, customer_id")
      .in("customer_id", customerIds);

    vehicles?.forEach((v: any) => {
      vehicleCounts[v.customer_id] =
        (vehicleCounts[v.customer_id] || 0) + 1;
    });
  }

  // Attach vehicle count per customer
  const enriched = inspections.map((ins) => ({
    ...ins,
    vehicle_count: vehicleCounts[ins.customer_id] || 0,
  }));

  return NextResponse.json(enriched);
}
