// app/api/debug/company/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fromProfiles: string | null = null;
  let fromMetadata: string | null = null;
  let fromVehicles: string | null = null;

  try {
    if (user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle();
      fromProfiles = (profile as any)?.company_id ?? null;
    }
  } catch {}

  fromMetadata = (user?.user_metadata as any)?.company_id ?? null;

  try {
    const { data: v } = await supabase
      .from("vehicles")
      .select("company_id")
      .not("company_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    fromVehicles = (v as any)?.company_id ?? null;
  } catch {}

  const company_id = fromProfiles ?? fromMetadata ?? fromVehicles ?? null;

  // counts for sanity (for whichever company we resolved)
  let vehicles = 0,
    locations = 0,
    customers = 0;

  if (company_id) {
    try {
      const v = await supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("company_id", company_id);
      vehicles = v.count ?? 0;
    } catch {}
    try {
      const l = await supabase
        .from("locations")
        .select("id", { count: "exact", head: true })
        .eq("company_id", company_id);
      locations = l.count ?? 0;
    } catch {}
    try {
      const c = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("company_id", company_id);
      customers = c.count ?? 0;
    } catch {}
  }

  return NextResponse.json({
    email: user?.email ?? null,
    resolved_company_id: company_id,
    via: {
      profiles: fromProfiles,
      user_metadata: fromMetadata,
      vehicles_latest: fromVehicles,
    },
    counts: { vehicles, locations, customers },
  });
}
