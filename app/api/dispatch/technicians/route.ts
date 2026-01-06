import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    // Fetch all users with role 'TECH'
    const { data: techs, error } = await supabase
      .from("users")
      .select("id, email")
      .eq("role", "TECH");

    if (error) throw error;

    return NextResponse.json({ ok: true, techs });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}