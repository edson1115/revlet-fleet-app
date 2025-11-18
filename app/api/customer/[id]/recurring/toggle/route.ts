// app/api/customer/[id]/recurring/toggle/route.ts

import { supabaseServer } from "@/lib/supabase/server";

function extractId(url: string) {
  const parts = new URL(url).pathname.split("/");
  return parts[parts.length - 3];
  // /api/customer/[id]/recurring/toggle
}

export async function POST(req: Request) {
  const customerId = extractId(req.url);
  const supabase = await supabaseServer();

  const body = await req.json().catch(() => ({}));
  const enabled = !!body.enabled;

  const { error } = await supabase
    .from("recurring_inspections")
    .update({ enabled })
    .eq("customer_id", customerId);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }

  return new Response(JSON.stringify({ success: true, enabled }), {
    status: 200,
  });
}
