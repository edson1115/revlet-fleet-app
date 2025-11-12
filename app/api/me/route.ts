// app/api/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole, permsFor, type Role } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isSuperAdminEmail(email?: string | null) {
  const envList = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const fallback = "edson.cortes@bigo.com";
  const e = (email || "").toLowerCase();
  return !!e && (envList.includes(e) || e === fallback);
}

export async function GET(_req: NextRequest) {
  try {
    const server = await supabaseServer();

    // 1) auth
    const { data: auth } = await server.auth.getUser();
    const user = auth?.user || null;
    if (!user) {
      return NextResponse.json(
        { ok: false, authed: false, me: null },
        { status: 200 }
      );
    }

    const email = user.email || null;
    const meta = (user.user_metadata ?? {}) as Record<string, any>;

    // 2) profile row (preferred truth)
    const { data: prof } = await server
      .from("profiles")
      .select(
        `
        id,
        email,
        role,
        company_id,
        customer_id,
        location_ids,
        technician_id,
        name
      `
      )
      .eq("id", user.id)
      .maybeSingle();

    // 3) derive role (profile → metadata → SUPERADMIN fallback)
    const roleRaw: string | null =
      (prof?.role as string | null) ??
      (meta?.role as string | null) ??
      (isSuperAdminEmail(email) ? "SUPERADMIN" : null);

    const role: Role = normalizeRole(roleRaw);

    // 4) build response
    const me = {
      id: user.id,
      email,
      name: (prof?.name as string | null) ?? (meta?.name as string | null) ?? null,
      role,
      company_id: (prof?.company_id as string | null) ?? (meta?.company_id as string | null) ?? null,
      customer_id: (prof?.customer_id as string | null) ?? (meta?.customer_id as string | null) ?? null,
    };

    // normalize arrayish fields
    const locationIds: string[] | undefined =
      (Array.isArray(prof?.location_ids) ? prof?.location_ids : undefined) ??
      (Array.isArray(meta?.location_ids) ? meta?.location_ids : undefined);

    const technicianId: string | null =
      (prof?.technician_id as string | null) ?? (meta?.technician_id as string | null) ?? null;

    const permissions = permsFor(role);

    return NextResponse.json(
      {
        ok: true,
        authed: true,
        me,
        role, // convenience
        permissions, // Perms (UI can trust this)
        scope: {
          companyId: me.company_id ?? null,
          customerId: me.customer_id ?? null,
          locationIds: locationIds ?? undefined,
          technicianId: technicianId ?? null,
        },
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, authed: false, me: null, error: e?.message || "failed" },
      { status: 200 }
    );
  }
}
