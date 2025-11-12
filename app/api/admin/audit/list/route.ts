import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSuper, isSuperAdminEmail } from "@/lib/admin/guard";


export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const gate = await requireSuper(supabase);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  let q = supabase.from("admin_audit").select("*").order("created_at", { ascending: false }).limit(500);
  if (email) q = q.ilike("target_email", `%${email}%`);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, rows: data || [] });
}
