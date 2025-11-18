// app/api/fm/inspections/calendar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("recurring_inspections")
    .select(`
      id,
      customer_id,
      frequency,
      weekday,
      day_of_month,
      next_run,
      active,
      customers:customer_id ( name )
    `)
    .order("next_run", { ascending: true });

  return NextResponse.json({ data, error });
}
