import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await supabaseServer();
  
  // Fetch profiles where role is 'TECH'
  // Note: Adjust 'TECH' if your database uses 'TECHNICIAN'
  const { data: techs, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "TECH")
    .order("full_name");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, techs: techs || [] });
}