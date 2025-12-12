// app/api/customer/vehicles/[id]/route.ts
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ⭐ FIX — unwrap params Promise
  const { id } = await params;

  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("vehicles")
    .select(
      `
      id,
      year,
      make,
      model,
      unit_number,
      plate,
      vin,
      notes_internal,
      customer:customer_id (
        id,
        name
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return new Response(
      JSON.stringify({ error: "Vehicle not found" }),
      { status: 404 }
    );
  }

  return new Response(JSON.stringify({ vehicle: data }), {
    status: 200,
  });
}
