// app/api/requests/[id]/parts/route.ts
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/auth/scope";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: any) {
  try {
    const scope = await resolveUserScope();
    if (!scope.uid) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

    const request_id = params.id;
    const body = await req.json().catch(() => ({}));
    const { part_name, part_number, qty, price } = body;

    if (!part_name) {
      return new Response(JSON.stringify({ error: "missing_part_name" }), { status: 400 });
    }

    if (!(scope.isSuper || scope.isAdmin || scope.role === "OFFICE" || scope.role === "DISPATCH")) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
    }

    const sb = await supabaseServer();

    const { error } = await sb.from("service_request_parts").insert({
      request_id,
      part_name,
      part_number: part_number ?? null,
      qty: qty ?? 1,
      price: price ?? null,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
