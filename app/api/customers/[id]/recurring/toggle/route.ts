import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request, { params }: any) {
  const supabase = await supabaseServer();
  const customerId = params.id;

  const body = await req.json();

  const { id, active } = body;

  const { error } = await supabase
    .from("recurring_inspections")
    .update({ active })
    .eq("id", id)
    .eq("customer_id", customerId);

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ ok: true });
}
