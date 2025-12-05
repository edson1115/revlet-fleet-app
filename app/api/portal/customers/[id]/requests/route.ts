// app/api/portal/customers/[id]/requests/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const url = new URL(req.url);
  const customerId = url.pathname.split("/")[4];

  const { data: requests } = await supabase
    .from("requests")
    .select(
      `
      id, status, service, notes, created_at, date_requested,
      vehicle:vehicle_id (id, year, make, model, plate, vin),
      assigned_tech:assigned_tech (id, full_name)
    `
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ requests });
}
