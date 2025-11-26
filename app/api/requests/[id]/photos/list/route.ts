// app/api/requests/[id]/photos/list/route.ts
import { supabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("request_photos")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    rows: data || [],
    error: error?.message || null,
  });
}
