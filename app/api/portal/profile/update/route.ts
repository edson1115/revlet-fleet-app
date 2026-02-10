import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server"; // FIX: Correct import

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const { data: updated, error } = await supabase
      .from("customers")
      .update({
        name: body.name,
        billing_contact: body.billing_contact,
        billing_email: body.billing_email,
        billing_phone: body.billing_phone,
        secondary_contact: body.secondary_contact,
        notes: body.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}