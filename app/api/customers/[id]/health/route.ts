import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request, { params }: any) {
  const supabase = await supabaseServer();
  const customerId = params.id;

  // Total vehicles
  const { count: vehicleCount } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", customerId);

  // Open requests
  const { count: openCount } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .neq("status", "COMPLETED");

  // Last inspection is based on last completed request
  const { data: lastCompleted } = await supabase
    .from("requests")
    .select("completed_at")
    .eq("customer_id", customerId)
    .neq("completed_at", null)
    .order("completed_at", { ascending: false })
    .limit(1);

  let daysSinceLastInspection = null;

  if (lastCompleted?.length) {
    const dt = new Date(lastCompleted[0].completed_at);
    const diff = Date.now() - dt.getTime();
    daysSinceLastInspection = Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // Basic health grade algorithm
  let grade = "B";
  if (openCount === 0) grade = "A";
  if (openCount > 5) grade = "C";
  if (openCount > 10) grade = "D";

  return Response.json({
    totalVehicles: vehicleCount ?? 0,
    openRequests: openCount ?? 0,
    daysSinceLastInspection,
    grade,
  });
}
