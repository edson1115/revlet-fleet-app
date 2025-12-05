import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const body = await req.json().catch(() => ({}));

  const { technician_id, start_at, end_at, request_id } = body;

  if (!technician_id || !start_at || !end_at) {
    return NextResponse.json({ blocks: [] });
  }

  const { data } = await supabase
    .from("schedule_blocks")
    .select("*")
    .eq("technician_id", technician_id)
    .neq("request_id", request_id)
    .lte("start_at", end_at)
    .gte("end_at", start_at);

  return NextResponse.json({ blocks: data || [] });
}



