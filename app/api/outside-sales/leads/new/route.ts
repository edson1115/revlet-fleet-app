import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ ok: false, error: "Unauthorized" });

  const { error } = await supabase.from("sales_leads").insert({
    rep_id: user.id,
    customer_name: body.customer_name,
    customer_email: body.customer_email,
    phone: body.phone,
    company_name: body.company_name,
    notes: body.notes,
    status: "NEW",
  });

  if (error) return NextResponse.json({ ok: false, error });

  return NextResponse.json({ ok: true });
}
