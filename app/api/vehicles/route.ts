// app/api/vehicles/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function resolveCompanyId() {
  const supabase = await supabaseServer();

  // Try profiles.company_id (ignore if table missing)
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id || null;
    if (userId) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userId)
        .maybeSingle();

      if (!error && profile?.company_id) return profile.company_id as string;
    }
  } catch {}

  // Fallback: user_metadata.company_id via /api/me
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/me`, { cache: "no-store" });
    if (res.ok) {
      const me = await res.json();
      if (me?.company_id) return me.company_id as string;
    }
  } catch {}

  return null;
}

export async function GET() {
  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();

  if (!company_id) {
    return NextResponse.json({ rows: [] }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("id, year, make, model, plate, unit_number, vin, created_at")
    .eq("company_id", company_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ rows: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { rows: data ?? [] },
    { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
