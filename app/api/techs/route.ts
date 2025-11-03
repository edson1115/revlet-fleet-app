// app/api/techs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function httpErr(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

async function resolveCompanyId(sb: any) {
  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id || null;
  if (!uid) return null;
  const { data: me } = await sb.from("profiles").select("company_id").eq("id", uid).maybeSingle();
  return (me?.company_id as string) || null;
}

/** GET /api/techs?active=1 */
export async function GET(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const company_id = await resolveCompanyId(sb);
    if (!company_id) return httpErr("no_company", 400);

    const activeOnly = req.nextUrl.searchParams.get("active") === "1";

    // Primary source: technicians table
    const base = sb
      .from("technicians")
      .select("id, full_name, phone, email, active")
      .eq("company_id", company_id)
      .order("full_name", { ascending: true });

    const { data: techs, error } = activeOnly ? await base.eq("active", true) : await base;
    if (error) throw error;

    if (Array.isArray(techs) && techs.length > 0) {
      const rows = techs.map((t: any) => ({
        id: t.id as string,
        name: (t.full_name as string) || "Unnamed",
        phone: (t.phone as string) || null,
        email: (t.email as string) || null,
        active: !!t.active,
      }));
      return NextResponse.json({ rows });
    }

    // Fallback: profiles with role=TECH (only if technicians table empty)
    const { data: profs, error: pfErr } = await sb
      .from("profiles")
      .select("id, full_name, role, active")
      .eq("company_id", company_id)
      .eq("role", "TECH")
      .order("full_name", { ascending: true });

    if (pfErr) throw pfErr;

    const rows = (profs ?? []).map((p: any) => ({
      id: p.id as string,
      name: (p.full_name as string) || "Unnamed",
      phone: null,
      email: null,
      active: !!p.active,
    }));
    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ rows: [], error: e?.message || "Failed to load techs" }, { status: 500 });
  }
}

/** POST /api/techs  Body: { full_name: string, phone?: string|null, email?: string|null, active?: boolean } */
export async function POST(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const company_id = await resolveCompanyId(sb);
    if (!company_id) return httpErr("no_company", 400);

    const body = await req.json().catch(() => ({} as any));
    const full_name = String(body?.full_name || "").trim();
    const phone = (body?.phone ?? null) ? String(body.phone).trim() : null;
    const email = (body?.email ?? null) ? String(body.email).trim() : null;
    const active = typeof body?.active === "boolean" ? !!body.active : true;

    if (!full_name) return httpErr("full_name_required", 400);

    const ins = await sb
      .from("technicians")
      .insert([{ company_id, full_name, phone, email, active }])
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
    const company_id = await resolveCompanyId(sb);
    if (!company_id) return httpErr("no_company", 400);

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return httpErr("id_required", 400);

    const del = await sb.from("technicians").delete().eq("id", id).eq("company_id", company_id);
    if (del.error) return httpErr(del.error.message, 500);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return httpErr(e?.message || "delete_failed", 500);
  }
}
