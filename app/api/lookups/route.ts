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

function ok(data: any) { return NextResponse.json({ ok: true, data }); }
function fail(error: string, code = 200) { return NextResponse.json({ ok: false, error }, { status: code }); }

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

    // ---------------- LOCATIONS ----------------
    // NOTE: company_locations has (id, name, company_id)
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
    // Supports:
    //  - ?location=<location_id>  -> list customers for that location's company_id
    //  - no filter                -> all customers (scoped by viewer company if not admin)
    if (scope === "customers") {
      const location = url.searchParams.get("location");

      // If a location is provided, look up its company_id, then list customers for that company
      if (location) {
        // load location (company_locations: id, name, company_id)
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

      // No filter: all customers (scoped by company for non-admins)
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
