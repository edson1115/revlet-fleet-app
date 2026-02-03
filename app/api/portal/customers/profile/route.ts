import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-helpers";

export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // CUSTOMER accounts connect via customers table
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("profile_id", user.id) // adjust if your FK field is different
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}



