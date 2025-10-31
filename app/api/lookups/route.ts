// app/api/lookups/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Super-admin allow list */
function isSuperAdminEmail(email?: string | null) {
  const envList = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const fallback = "edson.cortes@bigo.com";
  const e = (email || "").toLowerCase();
  return !!e && (envList.includes(e) || e === fallback);
}

function ok(data: any) {
  return NextResponse.json({ ok: true, data });
}
function fail(error: string, code = 200) {
  return NextResponse.json({ ok: false, error }, { status: code });
}

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const url = new URL(req.url);
  const scope = (url.searchParams.get("scope") || "").toLowerCase();

  // auth
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id || null;
  const email = auth?.user?.email || null;
  if (!uid) return fail("unauthorized", 401);

  const { data: prof } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", uid)
    .maybeSingle();

  const meta = (auth?.user?.user_metadata ?? {}) as Record<string, any>;
  const role = (prof?.role ?? meta?.role ?? (isSuperAdminEmail(email) ? "ADMIN" : null)) as string | null;
  const isAdmin = String(role || "").toUpperCase() === "ADMIN" || isSuperAdminEmail(email);
  const viewer_company_id = prof?.company_id ?? meta?.company_id ?? null;

  try {
    // ---------------- TECHNICIANS ----------------
    if (scope === "technicians") {
      let q = supabase.from("technicians").select("id, name").order("name", { ascending: true });
      if (!isAdmin && viewer_company_id) q = q.eq("company_id", viewer_company_id);
      const { data, error } = await q;
      if (error) return fail(error.message);
      return ok((data ?? []).map((r) => ({ id: r.id, name: r.name ?? r.id })));
    }

    // ---------------- COMPANIES (smart) ----------------
    if (scope === "companies") {
      // 1) try real companies table first
      const { data: companiesTable, error: companiesErr } = await supabase
        .from("companies")
        .select("id, name")
        .order("name", { ascending: true });

      if (!companiesErr && (companiesTable ?? []).length > 0) {
        // if not admin, narrow
        const filtered = !isAdmin && viewer_company_id
          ? (companiesTable ?? []).filter((c) => c.id === viewer_company_id)
          : (companiesTable ?? []);
        return ok(filtered.map((r) => ({ id: r.id, name: (r as any).name ?? r.id })));
      }

      // 2) fallback: derive from locations + customers
      const [locs, custs] = await Promise.all([
        supabase.from("company_locations").select("company_id, name").order("name", { ascending: true }),
        supabase.from("company_customers").select("company_id, name").order("name", { ascending: true }),
      ]);

      const byId = new Map<string, { id: string; name: string }>();

      // derive from locations
      if (!locs.error) {
        for (const row of locs.data ?? []) {
          const cid = (row as any).company_id as string | null;
          if (!cid) continue;
          // location name is not really company name, so use placeholder
          if (!byId.has(cid)) {
            byId.set(cid, { id: cid, name: `Company ${cid.slice(0, 8)}` });
          }
        }
      }

      // derive from customers (these usually have the nicer name)
      if (!custs.error) {
        for (const row of custs.data ?? []) {
          const cid = (row as any).company_id as string | null;
          if (!cid) continue;
          const current = byId.get(cid);
          const niceName = (row as any).name as string | null;
          if (!current) {
            byId.set(cid, { id: cid, name: niceName || `Company ${cid.slice(0, 8)}` });
          } else {
            // prefer customer name over placeholder
            if (niceName && current.name.startsWith("Company ")) {
              byId.set(cid, { id: cid, name: niceName });
            }
          }
        }
      }

      // scope for non-admin
      let rows = Array.from(byId.values());
      if (!isAdmin && viewer_company_id) {
        rows = rows.filter((r) => r.id === viewer_company_id);
      }

      return ok(rows);
    }

    // ---------------- LOCATIONS ----------------
    if (scope === "locations") {
      let q = supabase
        .from("company_locations")
        .select("id, name, company_id")
        .order("name", { ascending: true });

      if (!isAdmin && viewer_company_id) q = q.eq("company_id", viewer_company_id);

      const { data, error } = await q;
      if (error) return fail(error.message);

      const seen = new Set<string>();
      const rows = (data ?? []).filter((r) => (seen.has(r.id) ? false : seen.add(r.id)));
      return ok(rows.map((r) => ({ id: r.id, name: (r as any).name ?? r.id })));
    }

    // ---------------- CUSTOMERS ----------------
    if (scope === "customers") {
      const location = url.searchParams.get("location");

      if (location) {
        let qLoc = supabase
          .from("company_locations")
          .select("id, company_id")
          .eq("id", location)
          .limit(1);

        if (!isAdmin && viewer_company_id) qLoc = qLoc.eq("company_id", viewer_company_id);

        const loc = await qLoc.single();
        if (loc.error) return fail(loc.error.message);

        const locCompanyId = (loc.data as any)?.company_id ?? null;

        let qCust = supabase
          .from("company_customers")
          .select("id, name, company_id")
          .order("name", { ascending: true });

        if (locCompanyId) qCust = qCust.eq("company_id", locCompanyId);
        if (!isAdmin && viewer_company_id) qCust = qCust.eq("company_id", viewer_company_id);

        const { data, error } = await qCust;
        if (error) return fail(error.message);
        return ok((data ?? []).map((r) => ({ id: r.id, name: (r as any).name ?? r.id })));
      }

      let q = supabase
        .from("company_customers")
        .select("id, name, company_id")
        .order("name", { ascending: true });

      if (!isAdmin && viewer_company_id) q = q.eq("company_id", viewer_company_id);

      const { data, error } = await q;
      if (error) return fail(error.message);
      return ok((data ?? []).map((r) => ({ id: r.id, name: (r as any).name ?? r.id })));
    }

    return fail("unknown_scope", 400);
  } catch (e: any) {
    return fail(e?.message || "lookup_failed");
  }
}
