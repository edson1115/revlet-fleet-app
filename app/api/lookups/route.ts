// app/api/lookups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveCompanyId(sb: any) {
  try {
    const { data: auth } = await sb.auth.getUser();
    const uid = auth.user?.id || null;
    if (uid) {
      const { data: prof } = await sb.from("profiles").select("company_id").eq("id", uid).maybeSingle();
      if (prof?.company_id) return prof.company_id as string;
    }
  } catch {}
  try {
    const { data: v } = await sb
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

export async function GET(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const url = req.nextUrl;
    const scope = url.searchParams.get("scope") || "";
    const market = url.searchParams.get("market") || ""; // we treat this as location_id

    const company_id = await resolveCompanyId(sb);
    if (!company_id) return NextResponse.json({ data: [], error: "no_company" }, { status: 400 });

    // LOCATIONS
    if (scope === "locations") {
      const { data, error } = await sb
        .from("locations")
        .select("id, name")
        .eq("company_id", company_id)
        .order("name", { ascending: true });
      if (error) throw error;
      return NextResponse.json({ data: data ?? [] });
    }

    // CUSTOMERS (optionally filtered by location/market)
    if (scope === "customers") {
      // If no market/location provided, just return all company customers
      if (!market) {
        const { data, error } = await sb
          .from("customers")
          .select("id, name")
          .eq("company_id", company_id)
          .order("name", { ascending: true });
        if (error) throw error;
        return NextResponse.json({ data: data ?? [] });
      }

      // Attempt A: company_customer_locations (customer_id, location_id, company_id)
      try {
        const { data: links, error: linkErr } = await sb
          .from("company_customer_locations")
          .select("customer_id")
          .eq("company_id", company_id)
          .eq("location_id", market);
        if (!linkErr && Array.isArray(links) && links.length > 0) {
          const ids = links.map((r: any) => r.customer_id);
          const { data, error } = await sb
            .from("customers")
            .select("id, name")
            .eq("company_id", company_id)
            .in("id", ids)
            .order("name", { ascending: true });
          if (error) throw error;
          return NextResponse.json({ data: data ?? [] });
        }
      } catch {}

      // Attempt B: customer_locations (customer_id, location_id)
      try {
        const { data: links2, error: linkErr2 } = await sb
          .from("customer_locations")
          .select("customer_id")
          .eq("location_id", market);
        if (!linkErr2 && Array.isArray(links2) && links2.length > 0) {
          const ids = links2.map((r: any) => r.customer_id);
          const { data, error } = await sb
            .from("customers")
            .select("id, name")
            .eq("company_id", company_id)
            .in("id", ids)
            .order("name", { ascending: true });
          if (error) throw error;
          return NextResponse.json({ data: data ?? [] });
        }
      } catch {}

      // Fallback: return all company customers (no location filter)
      {
        const { data, error } = await sb
          .from("customers")
          .select("id, name")
          .eq("company_id", company_id)
          .order("name", { ascending: true });
        if (error) throw error;
        return NextResponse.json({ data: data ?? [] });
      }
    }

    // TECHNICIANS (active flag supported)
    if (scope === "technicians") {
      const activeOnly = url.searchParams.get("active") === "1";

      // Primary: technicians table
      try {
        let q = sb
          .from("technicians")
          .select("id, full_name, active")
          .eq("company_id", company_id)
          .order("full_name", { ascending: true });
        if (activeOnly) q = q.eq("active", true);
        const { data, error } = await q;
        if (!error && Array.isArray(data) && data.length > 0) {
          return NextResponse.json({
            data: data.map((t: any) => ({ id: t.id, name: t.full_name })),
          });
        }
      } catch {}

      // Fallback: profiles with role=TECH
      let q = sb
        .from("profiles")
        .select("id, full_name, role, active")
        .eq("company_id", company_id)
        .eq("role", "TECH")
        .order("full_name", { ascending: true });
      if (activeOnly) q = q.eq("active", true);
      const { data: profs, error: profErr } = await q;
      if (profErr) throw profErr;

      return NextResponse.json({
        data: (profs ?? []).map((p: any) => ({ id: p.id, name: p.full_name || "Tech" })),
      });
    }

    return NextResponse.json({ data: [], error: "unknown_scope" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ data: [], error: e?.message || "lookup_failed" }, { status: 500 });
  }
}
