// app/api/admin/markets/[id]/customers/route.ts
import { supabaseServer } from "@/lib/supabase/server";

async function handler(req: Request): Promise<Response> {
  // Extract the id manually from the URL instead of using typed params
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const marketId = segments[segments.length - 2]; // [id]/customers

  const supabase = await supabaseServer();

  const body = await req.json().catch(() => ({}));
  const customer_ids: string[] = Array.isArray(body.customer_ids)
    ? body.customer_ids
    : [];

  // 1. Clear old assignments
  await supabase
    .from("market_customer_links")
    .delete()
    .eq("market_id", marketId);

  // 2. Insert new assignments
  if (customer_ids.length > 0) {
    const rows = customer_ids.map((cid) => ({
      market_id: marketId,
      customer_id: cid,
    }));

    await supabase.from("market_customer_links").insert(rows);
  }

  return new Response(
    JSON.stringify({ success: true, marketId }),
    { status: 200 }
  );
}

export { handler as POST };
