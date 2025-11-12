// app/api/lookups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function pickCompanyScope(meta: any, prof: any, email?: string | null) {
  const company_id = prof?.company_id ?? meta?.company_id ?? null;
  const role = String(prof?.role ?? meta?.role ?? "").toUpperCase();
  const isSuper =
    role === "SUPERADMIN" ||
    role === "ADMIN" ||
    (email || "").toLowerCase() === "edson.cortes@bigo.com";
  return { company_id, isSuper };
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id || null;
    const email = auth?.user?.email || null;

    if (!uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("company_id, role, customer_id")
      .eq("id", uid)
      .maybeSingle();

    const meta = (auth?.user?.user_metadata ?? {}) as Record<string, any>;
    const { company_id, isSuper } = pickCompanyScope(meta, prof, email);

    const url = new URL(req.url);
    const type = (url.searchParams.get("type") || "").toLowerCase();

    const activeOnly = (url.searchParams.get("active") || "1") !== "0"; // default true
    const location_id = url.searchParams.get("location_id") || null;

    /* ---------------- LOCATIONS ---------------- */
    iif (type === "locations") {
  const keep = ["San Antonio", "Dallas", "Bay Area", "Sacramento", "Washington"];
  let q = supabase
    .from("company_locations")
    .select("id, name, is_active, company_id")
    .order("name", { ascending: true });

  // scope to company for non-super
  if (!isSuper && company_id) q = q.eq("company_id", company_id);

  // only active rows
  q = q.eq("is_active", true);

  const { data, error } = await q;
  if (error) throw error;

  // enforce allow-list + dedupe by lower(name); first occurrence wins
  const wanted = new Set(keep.map((n) => n.toLowerCase()));
  const byName = new Map<string, { id: string; name: string }>();
  for (const r of data || []) {
    const name = (r.name || "").trim();
    const key = name.toLowerCase();
    if (!wanted.has(key)) continue;
    if (!byName.has(key)) byName.set(key, { id: r.id, name });
  }

  // return in your preferred fixed order
  const rows = keep
    .map((n) => byName.get(n.toLowerCase()))
    .filter(Boolean) as { id: string; name: string }[];

  return NextResponse.json({ rows });
}


    /* ---------------- CUSTOMERS (by location) ---------------- */
    if (type === "customers") {
      if (!location_id) {
        return NextResponse.json({ rows: [] }); // or {error: 'location_id_required'}
      }

      // Inner-join bridge table to ensure only customers mapped to this location come back
      let q = supabase
        .from("company_customers")
        .select(
          "id, name, company_id, is_active, company_customers_locations!inner(location_id)"
        )
        .order("name", { ascending: true })
        .eq("company_customers_locations.location_id", location_id);

      if (!isSuper && company_id) q = q.eq("company_id", company_id);
      if (activeOnly) q = q.eq("is_active", true);

      const { data, error } = await q;
      if (error) throw error;

      const rows = (data || []).map((c: any) => ({ id: c.id, name: c.name }));
      return NextResponse.json({ rows });
    }

    return NextResponse.json({ error: "unsupported_type" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
