// app/api/requests/[id]/complete/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function resolveCompanyId() {
  const supabase = await supabaseServer();
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id || null;
    if (uid) {
      const { data: prof, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", uid)
        .maybeSingle();
      if (!error && prof?.company_id) return prof.company_id as string;
    }
  } catch {}
  try {
    const { data: v } = await supabase
      .from("vehicles")
      .select("company_id")
      .not("company_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (v?.company_id) return v.company_id as string;
  } catch {}
  return null;
}

export async function PATCH(_: Request, { params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  if (!company_id) return NextResponse.json({ error: "No company." }, { status: 400 });

  const now = new Date().toISOString();

  // Step 1 → SCHEDULED
  let { error } = await supabase
    .from("service_requests")
    .update({ status: "SCHEDULED", scheduled_at: now })
    .eq("id", params.id)
    .eq("company_id", company_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Step 2 → IN_PROGRESS
  ({ error } = await supabase
    .from("service_requests")
    .update({ status: "IN_PROGRESS", started_at: now })
    .eq("id", params.id)
    .eq("company_id", company_id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Step 3 → COMPLETED
  ({ error } = await supabase
    .from("service_requests")
    .update({ status: "COMPLETED", completed_at: now })
    .eq("id", params.id)
    .eq("company_id", company_id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
