import { serve } from "https://deno.land/std/http/server.ts";

serve(async () => {
  const res = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/outside_sales_sync`,
    {
      method: "POST",
      headers: {
        apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
        Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")!}`
      }
    }
  );

  const data = await res.json();
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
});
