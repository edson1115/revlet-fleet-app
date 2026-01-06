// app/api/dispatch/requests/alerts/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("service_requests")
    .select(`
      id,
      status,
      completed_at,
      waiting_at,
      waiting_for_parts_at,
      waiting_for_approval_at
    `)
    .neq("status", "COMPLETED");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alerts: data });
}
