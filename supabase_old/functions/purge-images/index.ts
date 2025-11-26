// supabase/functions/purge-images/index.ts
// Delete expired image objects + rows (expires_at < now()).
// Requires the service role key in env (functions have it) and Storage admin.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (_req) => {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, key);

    // Select up to N expired rows per run
    const { data: rows, error } = await sb
      .from("images")
      .select("id, key_work, key_thumb")
      .lte("expires_at", new Date().toISOString())
      .limit(1000);
    if (error) throw error;

    if (!rows?.length) return new Response(JSON.stringify({ ok: true, deleted: 0 }), { headers: { "content-type": "application/json" } });

    const bucket = sb.storage.from("proof");
    const keys = rows.flatMap((r) => [r.key_work, r.key_thumb]);

    // Remove objects (ignores missing)
    await bucket.remove(keys);

    // Delete rows
    const ids = rows.map((r) => r.id);
    const { error: delErr } = await sb.from("images").delete().in("id", ids);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ ok: true, deleted: rows.length }), { headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { "content-type": "application/json" } });
  }
});
