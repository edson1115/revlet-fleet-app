// app/api/customer/[id]/health/route.ts

import { supabaseServer } from "@/lib/supabase/server";

function extractId(url: string) {
  const parts = new URL(url).pathname.split("/");
  return parts[parts.length - 2]; // /customer/[id]/health
}

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const customerId = extractId(req.url);

  // Example: return vehicle count + inspection count
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id")
    .eq("customer_id", customerId);

  const { data: reqs } = await supabase
    .from("requests")
    .select("id")
    .eq("customer_id", customerId);

  return new Response(
    JSON.stringify({
      customer_id: customerId,
      vehicles: vehicles?.length ?? 0,
      requests: reqs?.length ?? 0,
    }),
    { status: 200 }
  );
}
