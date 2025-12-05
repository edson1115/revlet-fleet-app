import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request, { params }: any) {
  const supabase = await supabaseServer();
  const customerId = params.id;

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("customer_id", customerId)
    .order("name");

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ rows: data ?? [] });
}
