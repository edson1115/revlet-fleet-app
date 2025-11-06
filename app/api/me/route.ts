// app/api/me/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { permsFor, type Role } from "@/lib/permissions";

export const dynamic = "force-dynamic"; // never cache
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

export async function GET() {
  const supabase = await supabaseServer();

  // Session from cookies
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = auth.user;
  const meta = (user.user_metadata ?? {}) as Record<string, any>;

  // Try to read profile, but don't require it to consider the user "signed in"
  let company_id: string | null = null;
  let customer_id: string | null = null;
  let role: Role = "VIEWER";
  let full_name: string | null = null;
  let email: string | null = user.email ?? null;
  let allowed_location_ids: string[] | null = null;
  let technician_id: string | null = null;

  try {
    const { data: prof } = await supabase
      .from("profiles")
      .select("company_id, customer_id, role, full_name, email, allowed_location_ids, technician_id")
      .eq("id", user.id)
      .maybeSingle();

    company_id = prof?.company_id ?? meta?.company_id ?? null;
    customer_id = prof?.customer_id ?? meta?.customer_id ?? null;
    full_name = prof?.full_name ?? (meta?.full_name ?? null);
    email = prof?.email ?? email;
    allowed_location_ids = (prof?.allowed_location_ids as string[] | null) ?? (meta?.allowed_location_ids ?? null);
    technician_id = (prof?.technician_id as string | null) ?? (meta?.technician_id ?? null);

    // Role priority: SUPERADMIN (by email) > profile.role > meta.role > default VIEWER
    const profRole = prof?.role ? String(prof.role).toUpperCase() : null;
    role = isSuperAdminEmail(user.email)
      ? "SUPERADMIN"
      : (profRole as Role) ??
        ((meta?.role ? String(meta.role).toUpperCase() : "VIEWER") as Role);
  } catch {
    // If profiles table/row missing, still return a valid session payload
    company_id = meta?.company_id ?? null;
    customer_id = meta?.customer_id ?? null;
    full_name = meta?.full_name ?? null;
    allowed_location_ids = meta?.allowed_location_ids ?? null;
    technician_id = meta?.technician_id ?? null;
    role = isSuperAdminEmail(user.email)
      ? "SUPERADMIN"
      : ((meta?.role ? String(meta.role).toUpperCase() : "VIEWER") as Role);
  }

  // Compute permissions once, centrally
  const permissions = permsFor(role);

  // Normalized scope object for client use
  const scope = {
    companyId: company_id,
    customerId: customer_id,
    locationIds: Array.isArray(allowed_location_ids) ? allowed_location_ids : [],
    technicianId: technician_id ?? null,
  };

  return NextResponse.json({
    ok: true,
    id: user.id,
    role,
    name: full_name,
    email,
    company_id,
    customer_id,
    permissions,
    scope,
  });
}
