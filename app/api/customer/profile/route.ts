// app/api/customer/profile/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;

  if (!uid) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    );
  }

  // Get customer_id from profile
  const { data: prof } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", uid)
    .maybeSingle();

  if (!prof?.customer_id) {
    return NextResponse.json({ profile: null });
  }

  // Load customer record
  const { data: customer } = await supabase
    .from("customers")
    .select(
      "id, name, billing_contact, billing_email, billing_phone, secondary_contact, notes"
    )
    .eq("id", prof.customer_id)
    .maybeSingle();

  return NextResponse.json({ profile: customer ?? null });
}
