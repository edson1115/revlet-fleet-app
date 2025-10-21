import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const market = req.nextUrl.searchParams.get("market") || "";
    const supabase = await supabaseServer();

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id || null;

    let company_id: string | null = null;
    if (uid) {
      const { data: me } = await supabase.from("profiles").select("company_id").eq("id", uid).maybeSingle();
      company_id = (me?.company_id as string) || null;
    }

    let q = supabase.from("profiles").select("id, full_name, market, role, company_id").eq("role", "TECH");
    if (company_id) q = q.eq("company_id", company_id);
    if (market) q = q.eq("market", market);

    const { data, error } = await q.order("full_name", { ascending: true });
    if (error) throw error;

    const rows = (data || []).map((p: any) => ({ id: p.id as string, name: (p.full_name as string) || "Tech", market: (p.market as string) || null }));
    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ rows: [], error: e?.message || "Failed to load techs" }, { status: 500 });
  }
}
