// app/api/lookups/route.ts
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
      const { data: prof, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", uid)
        .maybeSingle();
      if (!error && prof?.company_id) return prof.company_id as string;
    }
  } catch {}
  try {
    const { data } = await supabase
      .from("service_requests")
      .select("company_id")
      .not("company_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.company_id) return data.company_id as string;
  } catch {}
  return null;
}

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const url = new URL(req.url);
  const scope = (url.searchParams.get("scope") || "").toLowerCase();

  const mine = url.searchParams.get("mine") === "1"; // vehicles created by current user only
  const company_id = await resolveCompanyId();

  function asOptions(rows: any[], mapLabel: (r: any) => string) {
    return (rows ?? []).map((r) => ({
      id: r.id,
      label: mapLabel(r),
    }));
  }

  try {
    if (scope === "technicians") {
      let q = supabase.from("profiles").select("id, full_name, name, email");
      if (company_id) q = q.eq("company_id", company_id);
      const { data, error } = await q;
      if (error) throw error;
      const rows = asOptions(data ?? [], (r) => r.full_name || r.name || r.email || r.id);
      return NextResponse.json({ success: true, data: rows });
    }

    if (scope === "customers") {
      let q = supabase.from("customers").select("id, name, company_id");
      if (company_id) q = q.or(`company_id.eq.${company_id},company_id.is.null`);
      const { data, error } = await q;
      if (error) throw error;
      const rows = asOptions(data ?? [], (r) => r.name || r.id);
      return NextResponse.json({ success: true, data: rows });
    }

    if (scope === "locations") {
      let q = supabase.from("company_locations").select("id, name, company_id");
      if (company_id) q = q.or(`company_id.eq.${company_id},company_id.is.null`);
      const { data, error } = await q;
      if (error) throw error;
      const rows = asOptions(data ?? [], (r) => r.name || r.id);
      return NextResponse.json({ success: true, data: rows });
    }

    if (scope === "vehicles") {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id || null;

      let q = supabase.from("vehicles").select("id, unit_number, year, make, model, plate, company_id, created_by");
      if (mine && uid) {
        q = q.eq("created_by", uid);
      } else if (company_id) {
        q = q.or(`company_id.eq.${company_id},company_id.is.null`);
      }

      const { data, error } = await q;
      if (error) throw error;

      const rows = asOptions(data ?? [], (v) => {
        const ymk = [v.year, v.make, v.model].filter(Boolean).join(" ");
        return (v.unit_number ?? ymk) || v.plate || v.id;
      });
      return NextResponse.json({ success: true, data: rows });
    }

    if (scope === "fmcs") {
      // If you have an "fmcs" table, read from it instead.
      const fmcs = [
        { id: "ARI", label: "ARI" },
        { id: "ENTERPRISE", label: "Enterprise Fleet" },
        { id: "DONLEN", label: "Donlen" },
        { id: "WHEELS", label: "Wheels" },
        { id: "GE_CAPITAL", label: "GE Capital" },
        { id: "ELEMENT", label: "Element" },
        { id: "OTHER", label: "Other / None" },
      ];
      return NextResponse.json({ success: true, data: fmcs });
    }

    return NextResponse.json({ success: false, error: "Unknown scope." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Lookup failed" }, { status: 500 });
  }
}
