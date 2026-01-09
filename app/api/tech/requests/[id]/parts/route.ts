import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = await resolveUserScope();
  const { id } = await params;

  // Techs, Office, Admins can all view parts
  if (!scope.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await supabaseServer();
  
  const { data: parts, error } = await supabase
    .from("request_parts")
    .select("id, part_name, part_number, quantity, inventory_id")
    .eq("request_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, parts });
}