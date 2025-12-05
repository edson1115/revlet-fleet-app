// app/api/portal/customers/[id]/vehicles/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const url = new URL(req.url);
  const customerId = url.pathname.split("/")[4];

  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select("id, year, make, model, plate, vin")
    .eq("customer_id", customerId)
    .order("year", { ascending: false });

  if (error) return NextResponse.json({ vehicles: [] });

  return NextResponse.json({ vehicles });
}
