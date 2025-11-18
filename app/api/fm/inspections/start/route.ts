// app/api/fm/inspections/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const { inspection_id } = await req.json();

  const { data, error } = await supabase
    .from("recurring_inspections")
    .update({ last_started_at: new Date().toISOString() })
    .eq("id", inspection_id)
    .select()
    .single();

  return NextResponse.json({ data, error });
}
