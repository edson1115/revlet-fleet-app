// app/api/admin/invite-user/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST body:
 * {
 *   email: string,
 *   role: "CUSTOMER" | "OFFICE" | "DISPATCHER" | "TECH" | "ADMIN",
 *   company_id?: string,
 *   customer_id?: string
 * }
 *
 * Only ADMIN or OFFICE can invite.
 * For CUSTOMER role, customer_id is strongly recommended.
 */
export async function POST(req: Request) {
  const server = await supabaseServer();

  // Authenticate the caller
  const { data: auth } = await server.auth.getUser();
  const uid = auth?.user?.id || null;
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // Caller profile + role
  const { data: caller, error: callerErr } = await server
    .from("profiles")
    .select("id, role, company_id")
    .eq("id", uid)
    .maybeSingle();
  if (callerErr) return NextResponse.json({ error: callerErr.message }, { status: 500 });

  const callerRole = String(caller?.role || "").toUpperCase();
  if (!["ADMIN", "OFFICE"].includes(callerRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as any));
  const email = String(body?.email || "").trim().toLowerCase();
  const role = String(body?.role || "CUSTOMER").toUpperCase();
  const company_id = String(body?.company_id || caller?.company_id || "");
  const customer_id = body?.customer_id ? String(body.customer_id) : null;

  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });
  if (!company_id) return NextResponse.json({ error: "company_id required." }, { status: 400 });

  // Enforce company scoping for OFFICE; ADMIN can invite cross-company if needed
  if (callerRole === "OFFICE" && caller?.company_id && caller.company_id !== company_id) {
    return NextResponse.json({ error: "Cross-company invite not allowed." }, { status: 403 });
  }

  try {
    const admin = supabaseAdmin();

    // 🔗 ensure email redirect hits your app's /auth/callback
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectTo = `${siteUrl}/auth/callback`;

    // Send magic-link invite; user sets password upon acceptance
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { role, company_id, customer_id },
      redirectTo,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // (Optional) Pre-seed a profiles row
    if (data?.user) {
      const prof = {
        id: data.user.id,
        role,
        company_id,
        customer_id,
        email,
      };
      await server.from("profiles").upsert(prof, { onConflict: "id" });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Invite failed" }, { status: 500 });
  }
}
