import { createClient } from "supabase";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE")!);

Deno.serve(async () => {
  const { data: due } = await supabase
    .from("recurring_inspections")
    .select(`
      id, customer_id, next_run,
      customer:customer_id ( id, name )
    `)
    .lte("next_run", new Date().toISOString())
    .eq("active", true);

  for (const item of due || []) {
    // Update next_run
    await supabase
      .from("recurring_inspections")
      .update({
        next_run: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .eq("id", item.id);
  }

  return new Response(JSON.stringify({ checked: true, count: due?.length || 0 }));
});
