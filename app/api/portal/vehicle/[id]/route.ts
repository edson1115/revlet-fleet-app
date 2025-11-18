// app/api/portal/vehicle/[id]/route.ts

import { supabaseServer } from "@/lib/supabase/server";

// Extract ID from: /api/portal/vehicle/[id]
function extractVehicleId(url: string) {
  const parts = new URL(url).pathname.split("/");
  return parts[parts.length - 1]; // <id>
}

export async function GET(req: Request) {
  const id = extractVehicleId(req.url);
  const supabase = await supabaseServer();

  // Fetch vehicle with joins
  const { data: vehicle, error: vErr } = await supabase
    .from("vehicles")
    .select(
      `
      id, customer_id,
      year, make, model, plate, unit_number, vin
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (vErr || !vehicle) {
    return new Response(JSON.stringify({ error: "Vehicle not found" }), {
      status: 404,
    });
  }

  // Load recent service requests
  const { data: requests } = await supabase
    .from("requests")
    .select("id, service, status, created_at")
    .eq("vehicle_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return new Response(
    JSON.stringify({
      vehicle,
      requests: requests ?? [],
    }),
    { status: 200 }
  );
}
