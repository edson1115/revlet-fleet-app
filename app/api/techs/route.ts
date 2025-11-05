// app/api/techs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function httpErr(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

function isSuperAdminEmail(email?: string | null) {
  const envList = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const fallback = "edson.cortes@bigo.com";
  const e = (email || "").toLowerCase();
  return !!e && (envList.includes(e) || e === fallback);
}

async function resolveScope(sb: any) {
  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id || null;
  const email = auth?.user?.email || null;

  let company_id: string | null = null;
  let role: string | null = null;

  if (uid) {
    const { data: me } = await sb
      .from("profiles")
      .select("company_id, role")
      .eq("id", uid)
      .maybeSingle();
    company_id = (me?.company_id as string) || null;
    role = (me?.role as string) || null;
  }

  const isAdmin =
    (role ? role.toUpperCase() === "ADMIN" : false) ||
    isSuperAdminEmail(email);

  return { uid, email, company_id, isAdmin };
}

/** GET /api/techs?active=1
 * - Admins see all technicians (optionally can pass ?company_id=... to scope).
 * - Non-admins see only their company's technicians.
 * Returns: { rows: Array<{id, name, phone, email, active}> }
 */
export async function GET(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const { company_id: myCompanyId, isAdmin } = await resolveScope(sb);

    const params = req.nextUrl.searchParams;
    const activeOnly = params.get("active") === "1";
    // Optional admin override (?company_id=UUID) to scope results
    const overrideCompanyId = params.get("company_id");

    // Build base query
    let q = sb
      .from("technicians")
      .select("id, full_name, phone, email, active, company_id")
      .order("full_name", { ascending: true });

    if (isAdmin) {
      // If admin provided a specific company scope, apply it
      if (overrideCompanyId) {
        q = q.eq("company_id", overrideCompanyId);
      }
      // else: no company filter → all techs visible
    } else {
      // Non-admin must be scoped to their company
      if (!myCompanyId) return httpErr("no_company", 400);
      q = q.eq("company_id", myCompanyId);
    }

    if (activeOnly) q = q.eq("active", true);

    const { data: techs, error } = await q;
    if (error) throw error;

    const rows = (techs || []).map((t: any) => ({
      id: t.id as string,
      name: (t.full_name as string) || "Unnamed",
      phone: (t.phone as string) || null,
      email: (t.email as string) || null,
      active: !!t.active,
    }));

    // If technicians table is empty for this scope, fall back to profiles with role=TECH
    if (rows.length === 0) {
      let p = sb
        .from("profiles")
        .select("id, full_name, role, active, company_id")
        .eq("role", "TECH")
        .order("full_name", { ascending: true });

      if (isAdmin) {
        if (overrideCompanyId) p = p.eq("company_id", overrideCompanyId);
      } else {
        if (!myCompanyId) return httpErr("no_company", 400);
        p = p.eq("company_id", myCompanyId);
      }

      if (activeOnly) p = p.eq("active", true);

      const { data: profs, error: pfErr } = await p;
      if (pfErr) throw pfErr;

      const fallbacks = (profs ?? []).map((p: any) => ({
        id: p.id as string,
        name: (p.full_name as string) || "Unnamed",
        phone: null,
        email: null,
        active: !!p.active,
      }));

      return NextResponse.json({ rows: fallbacks });
    }

    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ rows: [], error: e?.message || "Failed to load techs" }, { status: 500 });
  }
}

/** POST /api/techs  Body: { full_name: string, phone?: string|null, email?: string|null, active?: boolean } */
export async function POST(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const { company_id, isAdmin } = await resolveScope(sb);
    if (!company_id && !isAdmin) return httpErr("no_company", 400);

    const body = await req.json().catch(() => ({} as any));
    const full_name = String(body?.full_name || "").trim();
    const phone = (body?.phone ?? null) ? String(body.phone).trim() : null;
    const email = (body?.email ?? null) ? String(body.email).trim() : null;
    const active = typeof body?.active === "boolean" ? !!body.active : true;

    if (!full_name) return httpErr("full_name_required", 400);

    const ins = await sb
      .from("technicians")
      .insert([{ company_id: company_id ?? body?.company_id ?? null, full_name, phone, email, active }])
      .select("id, full_name, phone, email, active")
      .single();

    if (ins.error) return httpErr(ins.error.message, 500);

    return NextResponse.json({
      id: ins.data.id,
      name: ins.data.full_name,
      phone: ins.data.phone,
      email: ins.data.email,
      active: ins.data.active,
    });
  } catch (e: any) {
    return httpErr(e?.message || "create_failed", 500);
  }
}

/** DELETE /api/techs?id=uuid */
export async function DELETE(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const { company_id, isAdmin } = await resolveScope(sb);

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return httpErr("id_required", 400);

    // Admins can delete any tech; non-admins restricted to their company
    let del = sb.from("technicians").delete().eq("id", id);
    if (!isAdmin) {
      if (!company_id) return httpErr("no_company", 400);
      del = del.eq("company_id", company_id);
    }

    const res = await del;
    if (res.error) return httpErr(res.error.message, 500);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return httpErr(e?.message || "delete_failed", 500);
  }
}
