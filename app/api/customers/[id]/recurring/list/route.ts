import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request, { params }: any) {
  const supabase = await supabaseServer();
  const customerId = params.id;

  const { data, error } = await supabase
    .from("recurring_inspections")
    .select("*")
    .eq("customer_id", customerId)
    .order("next_run", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ data });
}
