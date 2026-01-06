import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    // Fetch all provider companies (FMCs)
    const { data: fmcs, error } = await supabase
      .from("provider_companies")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ ok: true, rows: fmcs });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}