// app/api/admin/bootstrap/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function deriveFmc(name: string) {
  // Build a short, uppercase code: take letters of each word, or fallback
  const words = name.trim().split(/\s+/);
  let code = words.map(w => w.replace(/[^A-Za-z0-9]/g, "").slice(0, 3)).join("").toUpperCase();
  if (!code) code = "COMP";
  // Trim to 3–8 chars
  if (code.length < 3) code = (code + "XXXX").slice(0, 3);
  if (code.length > 8) code = code.slice(0, 8);
  return code;
}

/**
 * POST /api/admin/bootstrap
 * Body (optional):
 *  {
 *    company_name?: string,        // default "Bigo Tires"
 *    company_fmc?: string,         // if omitted we derive from name
 *    role?: "ADMIN"|"OFFICE"|"DISPATCHER"|"TECH"|"CUSTOMER"  // default ADMIN
 *  }
 *
 * Creates (or finds) a company and upserts caller's profiles row.
 */
export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const body = await req.json().catch(() => ({} as any));

  const company_name = (body.company_name || "Bigo Tires").toString().trim();
  const desiredRole = String(body.role || "ADMIN").toUpperCase();
  let company_fmc: string = (body.company_fmc ? String(body.company_fmc) : "").trim().toUpperCase();
  if (!company_fmc) company_fmc = deriveFmc(company_name);

  // Who is calling?
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id || null;
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const email = auth?.user?.email ?? null;
  const full_name =
    (auth?.user?.user_metadata as any)?.full_name ??
    (auth?.user?.user_metadata as any)?.name ??
    null;

  // 1) Find existing company by name or fmc
  let company_id: string | null = null;
  {
    // try by name
    const byName = await supabase.from("companies").select("id,fmc,name").eq("name", company_name).limit(1).maybeSingle();
    if (!byName.error && byName.data?.id) {
      company_id = byName.data.id;
    } else {
      // try by fmc
      const byFmc = await supabase.from("companies").select("id,fmc,name").eq("fmc", company_fmc).limit(1).maybeSingle();
      if (!byFmc.error && byFmc.data?.id) {
        company_id = byFmc.data.id;
      }
    }
  }

  // 2) Create company if still missing (include required NOT NULL column fmc)
  if (!company_id) {
    const insertRes = await supabase
      .from("companies")
      .insert({ name: company_name, fmc: company_fmc }) // add other required defaults here if your schema has them
      .select("id")
      .single();

    if (!insertRes.error && insertRes.data?.id) {
      company_id = insertRes.data.id;
    } else {
      // If insert failed (e.g., duplicate fmc/name under RLS race), try to fetch again by fmc
      const retry = await supabase.from("companies").select("id").eq("fmc", company_fmc).limit(1).maybeSingle();
      if (!retry.error && retry.data?.id) {
        company_id = retry.data.id;
      } else {
        return NextResponse.json({ error: insertRes.error?.message || "company_create_failed" }, { status: 500 });
      }
    }
  }

  // 3) Update existing profile; if none, insert
  const updateRes = await supabase
    .from("profiles")
    .update({ email, full_name, role: desiredRole, company_id })
    .eq("id", uid)
    .select("id")
    .maybeSingle();

  if (!updateRes.data) {
    const ins = await supabase
      .from("profiles")
      .insert({ id: uid, email, full_name, role: desiredRole, company_id })
      .select("id")
      .single();
    if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: uid,
    role: desiredRole,
    company_id,
    customer_id: null,
    name: full_name,
    email,
  });
}
