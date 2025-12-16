import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function GET(req, { params }) {
  const scope = await resolveUserScope();
  if (!scope.isCustomer) return NextResponse.json({ ok: false }, { status: 401 });

  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ ok: false, error });

  return NextResponse.json({ ok: true, vehicle: data });
}
