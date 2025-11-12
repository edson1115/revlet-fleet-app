import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSuper, isSuperAdminEmail } from "@/lib/admin/guard";


export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = await supabaseServer();
  const gate = await requireSuper(supabase);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, company_id, customer_id, location_ids, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, rows: data || [] });
}
