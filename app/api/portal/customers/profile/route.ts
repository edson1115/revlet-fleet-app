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

  // CUSTOMER accounts connect via customers table
  // Assuming 'email' or 'profile_id' links them. 
  // If your table uses 'email', change .eq("profile_id", user.id) to .eq("email", user.email)
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("email", user.email) // Common pattern: link by email
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}