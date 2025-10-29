// app/api/me/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

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
  let role: string | null = null;

  try {
    const { data: prof } = await supabase
      .from("profiles")
      .select("company_id, customer_id, role, full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    company_id = prof?.company_id ?? meta?.company_id ?? null;
    customer_id = prof?.customer_id ?? meta?.customer_id ?? null;

    // Role priority: SUPERADMIN (by email) > profile.role > meta.role
    const profRole = prof?.role ? String(prof.role).toUpperCase() : null;
    role = isSuperAdminEmail(user.email)
      ? "SUPERADMIN"
      : profRole ?? (meta?.role ? String(meta.role).toUpperCase() : null);
  } catch {
    // If profiles table/row missing, still return a valid session payload
    company_id = meta?.company_id ?? null;
    customer_id = meta?.customer_id ?? null;
    role = isSuperAdminEmail(user.email) ? "SUPERADMIN" : (meta?.role ? String(meta.role).toUpperCase() : null);
  }

  return NextResponse.json({
    id: user.id,
    role,
    company_id,
    customer_id,
    name: meta?.full_name ?? user.user_metadata?.full_name ?? null,
    email: user.email ?? null,
    // Optional future scoping:
    allowed_location_ids: meta?.allowed_location_ids ?? null,
  });
}
