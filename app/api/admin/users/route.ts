// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Role = "CUSTOMER" | "OFFICE" | "DISPATCH" | "TECH" | "ADMIN" | "FLEET_MANAGER";

async function resolveCompanyId() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id || null;

  if (uid) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", uid)
      .maybeSingle();
    if (prof?.company_id) return { supabase, company_id: prof.company_id as string };
  }

  const { data: v } = await supabase
    .from("vehicles")
    .select("company_id")
    .not("company_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { supabase, company_id: (v?.company_id as string) ?? null };
}

// GET: list users (profiles) for my company
export async function GET() {
  try {
    await requireRole(["ADMIN"]);

    const { supabase, company_id } = await resolveCompanyId();
    if (!company_id) {
      return NextResponse.json({ users: [] });
    }

    // Note: some projects don't store email on profiles. We only return fields that exist.
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, company_id") // add other columns here if your schema has them
      .eq("company_id", company_id)
      .order("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data ?? [] });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg.toLowerCase().includes("forbidden") || msg.toLowerCase().includes("unauthorized")) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: update a user's role (admin only)
// body: { id: string, role: Role }
export async function POST(req: Request) {
  try {
    await requireRole(["ADMIN"]);

    const body = (await req.json().catch(() => ({}))) as { id?: string; role?: Role };
    const id = body.id?.trim();
    const role = body.role;

    const allowed: Role[] = ["CUSTOMER", "OFFICE", "DISPATCH", "TECH", "ADMIN", "FLEET_MANAGER"];
    if (!id || !role || !allowed.includes(role)) {
      return NextResponse.json({ error: "Missing or invalid id/role" }, { status: 400 });
    }

    const supabase = await supabaseServer();
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg.toLowerCase().includes("forbidden") || msg.toLowerCase().includes("unauthorized")) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
