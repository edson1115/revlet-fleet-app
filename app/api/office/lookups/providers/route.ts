import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: providers } = await supabase
    .from("provider_companies")
    .select("id, name")
    .order("name");

  return NextResponse.json({ ok: true, providers: providers || [] });
}