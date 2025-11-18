// app/api/customer/[id]/recurring/list/route.ts

import { supabaseServer } from "@/lib/supabase/server";

// Utility: extract the ID manually from the URL
function extractId(url: string) {
  const parts = new URL(url).pathname.split("/");
  return parts[parts.length - 3]; 
  // path is /api/customer/[id]/recurring/list
}

export async function GET(req: Request) {
  const customerId = extractId(req.url);
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("recurring_inspections")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }

  return new Response(JSON.stringify({ rows: data ?? [] }), {
    status: 200,
  });
}
