// app/api/portal/customers/[id]/settings/update/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const customerId = new URL(req.url).pathname.split("/")[4];
  const body = await req.json();

  const { error } = await supabase
    .from("customers")
    .update({
      name: body.name,
      billing_contact: body.billing_contact,
      billing_email: body.billing_email,
      billing_phone: body.billing_phone,
      notes: body.notes,
    })
    .eq("id", customerId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
