// app/api/admin/markets/[id]/route.ts
import { supabaseServer } from "@/lib/supabase/server";

// Utility to extract last dynamic segment
function extractIdFromUrl(url: string) {
  const parts = new URL(url).pathname.split("/");
  return parts[parts.length - 1];
}

/* -------------------------
   DELETE MARKET
-------------------------- */
async function handleDelete(req: Request): Promise<Response> {
  const marketId = extractIdFromUrl(req.url);

  const password = req.headers.get("x-admin-password") ?? "";
  if (password.length !== 15) {
    return new Response(
      JSON.stringify({ error: "Invalid admin password" }),
      { status: 401 }
    );
  }

  const supabase = await supabaseServer();

  await supabase
    .from("market_customer_links")
    .delete()
    .eq("market_id", marketId);

  await supabase
    .from("markets")
    .delete()
    .eq("id", marketId);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

/* -------------------------
   PATCH MARKET (Rename)
-------------------------- */
async function handlePatch(req: Request): Promise<Response> {
  const marketId = extractIdFromUrl(req.url);
  const supabase = await supabaseServer();

  const body = await req.json().catch(() => ({}));
  const name = (body?.name || "").trim();

  if (!name) {
    return new Response(
      JSON.stringify({ error: "Missing name" }),
      { status: 400 }
    );
  }

  await supabase
    .from("markets")
    .update({ name })
    .eq("id", marketId);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

/* -------------------------
   ENTRYPOINT ROUTER  
-------------------------- */
export async function DELETE(req: Request) {
  return handleDelete(req);
}

export async function PATCH(req: Request) {
  return handlePatch(req);
}
