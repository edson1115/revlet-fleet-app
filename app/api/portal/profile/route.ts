import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server"; // FIX: Correct import

export async function GET() {
  const supabase = await supabaseServer();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: cust } = await supabase
    .from("customers")
    .select(`
      id,
      name,
      billing_contact,
      billing_email,
      billing_phone,
      secondary_contact,
      notes
    `)
    // Note: If this fails to find data, ensure your customers table has a 'profile_id' column
    // or change this to .eq("email", user.email)
    .eq("profile_id", user.id) 
    .maybeSingle();

  return NextResponse.json(cust || {});
}