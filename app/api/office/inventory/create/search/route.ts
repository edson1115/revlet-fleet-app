import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function GET(req: Request) {
  const scope = await resolveUserScope();
  if (!scope.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  if (!query) return NextResponse.json({ results: [] });

  const supabase = await supabaseServer();

  // Search by Part Number OR Part Name
  const { data, error } = await supabase
    .from("inventory")
    .select("id, part_number, part_name, quantity, sell_price")
    .or(`part_number.ilike.%${query}%,part_name.ilike.%${query}%`)
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ results: data });
}