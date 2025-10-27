// app/api/techs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer"; // <- use your consolidated import

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const market = url.searchParams.get("market") || ""; // kept for backwards-compat (only applies to profiles fallback)
    const activeOnly = url.searchParams.get("active") === "1"; // optional
    const sb = await supabaseServer();

    // Resolve caller's company
    const { data: auth } = await sb.auth.getUser();
    const uid = auth.user?.id || null;

    let company_id: string | null = null;
    if (uid) {
      const { data: me } = await sb.from("profiles").select("company_id").eq("id", uid).maybeSingle();
      company_id = (me?.company_id as string) || null;
    }
    if (!company_id) {
      return NextResponse.json({ rows: [], error: "no_company" }, { status: 400 });
    }

    // ---------- Primary: technicians table ----------
    // Try to read active technicians for this company.
    // (If table doesn't exist or returns empty and you want fallback, we handle that below.)
    const techSel = sb
      .from("technicians")
      .select("id, full_name, active")
      .eq("company_id", company_id)
      .order("full_name", { ascending: true });

    const { data: techs, error: techErr } = activeOnly ? await techSel.eq("active", true) : await techSel;

    // If technicians table exists and returns rows, use it.
    if (!techErr && Array.isArray(techs) && techs.length > 0) {
      const rows = techs.map((t: any) => ({
        id: t.id as string,
        name: (t.full_name as string) || "Tech",
        market: null as string | null, // technicians table has no market field (by design)
      }));
      return NextResponse.json({ rows });
    }

    // ---------- Fallback: profiles with role=TECH ----------
    // If you haven't migrated fully yet, we’ll read TECH users from profiles.
    // NOTE: market filter only applies here (profiles had market; technicians doesn’t).
    let q = sb
      .from("profiles")
      .select("id, full_name, market, role, company_id, active")
      .eq("role", "TECH")
      .eq("company_id", company_id)
      .order("full_name", { ascending: true });

    if (market) q = q.eq("market", market);
    if (activeOnly) q = q.eq("active", true).in("role", ["TECH"]); // in case role is nullable in old data

    const { data: profs, error: profErr } = await q;

    if (profErr) throw profErr;

    const rows = (profs || []).map((p: any) => ({
      id: p.id as string,
      name: (p.full_name as string) || "Tech",
      market: (p.market as string) || null,
    }));

    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ rows: [], error: e?.message || "Failed to load techs" }, { status: 500 });
  }
}
