// app/api/portal/customers/[id]/contacts/create/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const body = await req.json();
  const customerId = new URL(req.url).pathname.split("/")[4];

  await supabase.from("customer_contacts").insert({
    customer_id: customerId,
    name: body.name,
    role: body.role,
    email: body.email,
    phone: body.phone,
  });

  return NextResponse.json({ success: true });
}
