// app/api/debug/company/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function resolveCompanyId() {
  const supabase = await supabaseServer();
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id || null;
    if (uid) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", uid)
        .maybeSingle();
      if (prof?.company_id) return { source: "profile", company_id: prof.company_id as string };
    }
  } catch {}

  try {
    const { data } = await supabase
      .from("vehicles")
      .select("company_id")
      .not("company_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.company_id) return { source: "vehicles_any", company_id: data.company_id as string };
  } catch {}

  try {
    const { data } = await supabase
      .from("customers")
      .select("company_id")
      .not("company_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.company_id) return { source: "customers_any", company_id: data.company_id as string };
  } catch {}

  try {
    const { data } = await supabase
      .from("company_locations")
      .select("company_id")
      .not("company_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.company_id) return { source: "locations_any", company_id: data.company_id as string };
  } catch {}

  try {
    const { data } = await supabase
      .from("service_requests")
      .select("company_id")
      .not("company_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.company_id) return { source: "requests_any", company_id: data.company_id as string };
  } catch {}

  return { source: null, company_id: null };
}

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const url = new URL(req.url);
  const vehicle_id = url.searchParams.get("vehicle_id") || undefined;
  const location_id = url.searchParams.get("location_id") || undefined;
  const customer_id = url.searchParams.get("customer_id") || undefined;

  // Primary resolver
  const primary = await resolveCompanyId();

  // Infer from specific entity ids (same logic your POST uses)
  async function infer() {
    if (vehicle_id) {
      const { data } = await supabase.from("vehicles").select("company_id").eq("id", vehicle_id).maybeSingle();
      if (data?.company_id) return { source: "vehicle_id", company_id: data.company_id as string };
    }
    if (location_id) {
      const { data } = await supabase.from("company_locations").select("company_id").eq("id", location_id).maybeSingle();
      if (data?.company_id) return { source: "location_id", company_id: data.company_id as string };
    }
    if (customer_id) {
      const { data } = await supabase.from("customers").select("company_id").eq("id", customer_id).maybeSingle();
      if (data?.company_id) return { source: "customer_id", company_id: data.company_id as string };
    }
    return { source: null, company_id: null };
  }

  const inferred = await infer();

  return NextResponse.json({ primary, inferred, vehicle_id, location_id, customer_id });
}
