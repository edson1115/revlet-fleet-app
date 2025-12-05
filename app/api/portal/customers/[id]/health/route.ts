// app/api/portal/customers/[id]/health/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const url = new URL(req.url);
  const customerId = url.pathname.split("/")[4];

  const { count: totalVehicles } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", customerId);

  const { count: openRequests } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .neq("status", "COMPLETED");

  const grade =
    openRequests === 0 ? "A+" : openRequests < (totalVehicles || 1) / 2 ? "B" : "C";

  return NextResponse.json({
    totalVehicles: totalVehicles || 0,
    openRequests: openRequests || 0,
    daysSinceLastInspection: 17,
    grade,
  });
}
