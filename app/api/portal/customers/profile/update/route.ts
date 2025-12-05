import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/permissions";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const body = await req.json();

  const {
    customer_id,
    name,
    address,
    billing_contact,
    billing_email,
    billing_phone,
    secondary_contact,
    notes,
  } = body;

  // Validate required fields
  if (!customer_id) {
    return NextResponse.json(
      { error: "customer_id is required" },
      { status: 400 }
    );
  }

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole(user.user_metadata?.role);

  // -----------------------------------------------------------
  // ROLE LOGIC:
  //
  // • CUSTOMER → can only update their own customer record
  // • OFFICE / FM / ADMIN / SUPERADMIN → can update *any* customer
  // -----------------------------------------------------------
  if (role === "CUSTOMER") {
    const { data: customerRow } = await supabase
      .from("customers")
      .select("id, profile_id")
      .eq("id", customer_id)
      .maybeSingle();

    // Customer’s user.id must match customer.profile_id
    if (!customerRow || customerRow.profile_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: Cannot edit another customer's profile" },
        { status: 403 }
      );
    }
  }

  // -----------------------------------------------------------
  // UPDATE CUSTOMER
  // -----------------------------------------------------------
  const { error } = await supabase
    .from("customers")
    .update({
      name,
      address,
      billing_contact,
      billing_email,
      billing_phone,
      secondary_contact,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customer_id);

  if (error) {
    console.error("Customer update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}



