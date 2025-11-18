// app/api/portal/customers/[id]/route.ts

import { supabaseServer } from "@/lib/supabase/server";

// Extracts ID from: /api/portal/customers/[id]
function extractCustomerId(url: string) {
  const parts = new URL(url).pathname.split("/");
  return parts[parts.length - 1]; 
  // .../customers/<id>
}

export async function GET(req: Request) {
  const customerId = extractCustomerId(req.url);
  const supabase = await supabaseServer();

  // Load customer + their requests + vehicles
  const { data: customer, error: err1 } = await supabase
    .from("customers")
    .select("id, name, address, approval_type")
    .eq("id", customerId)
    .maybeSingle();

  if (err1 || !customer) {
    return new Response(
      JSON.stringify({ error: "Customer not found" }),
      { status: 404 }
    );
  }

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("customer_id", customerId);

  const { data: requests } = await supabase
    .from("requests")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  return new Response(
    JSON.stringify({
      customer,
      vehicles: vehicles ?? [],
      requests: requests ?? [],
    }),
    { status: 200 }
  );
}
