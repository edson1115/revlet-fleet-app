// app/api/portal/customers/[id]/contacts/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const url = new URL(req.url);
  const customerId = url.pathname.split("/")[4];

  const { data: contacts } = await supabase
    .from("customer_contacts")
    .select("*")
    .eq("customer_id", customerId)
    .order("name");

  return NextResponse.json({ contacts });
}
