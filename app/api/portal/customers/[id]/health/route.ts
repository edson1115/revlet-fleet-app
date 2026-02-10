import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const customerId = params.id;
  const supabase = await supabaseServer();

  // 1. Get Total Vehicles Count
  const { count: totalVehicles } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", customerId);

  // 2. Get Open Requests Count
  // Note: Using 'service_requests' table to match project standard
  const { count: openRequests } = await supabase
    .from("service_requests")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .neq("status", "COMPLETED")
    .neq("status", "CANCELLED");

  // FIX: Ensure counts are numbers (default to 0 if null)
  const safeTotal = totalVehicles || 0;
  const safeOpen = openRequests || 0;

  // Calculate Grade
  let grade = "C";
  if (safeOpen === 0) {
    grade = "A+";
  } else if (safeOpen < (safeTotal || 1) / 2) {
    grade = "B";
  }

  return NextResponse.json({
    totalVehicles: safeTotal,
    openRequests: safeOpen,
    daysSinceLastInspection: 17, // Placeholder or fetch real data
    grade,
  });
}