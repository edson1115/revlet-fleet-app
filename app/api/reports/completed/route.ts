// app/api/reports/completed/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveCompanyId() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id || null;

  if (uid) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", uid)
      .maybeSingle();
    if (prof?.company_id) return { supabase, company_id: prof.company_id as string };
  }

  const { data: v } = await supabase
    .from("vehicles")
    .select("company_id")
    .not("company_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { supabase, company_id: (v?.company_id as string) ?? null };
}

export async function GET() {
  try {
    const { supabase, company_id } = await resolveCompanyId();
    if (!company_id) return NextResponse.json({ rows: [] });

    const { data, error } = await supabase
      .from("service_requests")
      .select(
        `
        id, status, created_at, scheduled_at, started_at, completed_at,
        service, po, notes,
        customer:customer_id ( name, market ),
        vehicle:vehicle_id ( year, make, model, plate, unit_number )
      `
      )
      .eq("company_id", company_id)
      .eq("status", "COMPLETED")
      .order("completed_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ rows: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
