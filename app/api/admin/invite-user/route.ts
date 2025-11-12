// app/api/admin/invite-user/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPERADMINS = (process.env.SUPERADMIN_EMAILS || "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const ALLOWED_ROLES = new Set(["SUPERADMIN","ADMIN","OFFICE","DISPATCH","TECH","CUSTOMER"]);

function isSuper(email?: string | null) {
  const e = (email || "").toLowerCase();
  return !!e && (SUPERADMINS.includes(e) || e === "edson.cortes@bigo.com");
}

export async function POST(req: Request) {
  try {
    const server = await supabaseServer();
    const { data: { user: caller } } = await server.auth.getUser();
    if (!caller) return NextResponse.json({ error: "Auth session missing." }, { status: 401 });
    const callerEmail = (caller.email || "").toLowerCase();

    const { data: callerProfile } = await server
      .from("profiles")
      .select("id, role, company_id")
      .eq("id", caller.id)
      .maybeSingle();

    const callerRole = isSuper(callerEmail)
      ? "SUPERADMIN"
      : String(callerProfile?.role || "CUSTOMER").toUpperCase();

    if (!["SUPERADMIN","ADMIN","OFFICE"].includes(callerRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({} as any));
    const email = String(body?.email || "").trim().toLowerCase();
    const role = String(body?.role || "CUSTOMER").trim().toUpperCase();

    const account_name = body?.account_name ? String(body.account_name) : null;
    const account_number = body?.account_number ? String(body.account_number) : null;
    const contact_name = body?.contact_name ? String(body.contact_name) : null;
    const contact_phone = body?.contact_phone ? String(body.contact_phone) : null;

    const location_id = body?.location_id ? String(body.location_id) : null;
    const location_ids: string[] = Array.isArray(body?.location_ids) ? body.location_ids : (location_id ? [location_id] : []);
    const customer_id = body?.customer_id ? String(body.customer_id) : null;

    const rawCompany =
      isSuper(callerEmail) && body?.company_id
        ? String(body.company_id)
        : (callerProfile?.company_id || null);

    const company_id = rawCompany || null;

    if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });
    if (!ALLOWED_ROLES.has(role)) return NextResponse.json({ error: "invalid_role" }, { status: 400 });
    if (!company_id) return NextResponse.json({ error: "company_id required." }, { status: 400 });

    if (role === "CUSTOMER") {
      if (!customer_id) return NextResponse.json({ error: "customer_id required for CUSTOMER" }, { status: 400 });
    } else if (["OFFICE","DISPATCH","TECH","ADMIN"].includes(role)) {
      if (!location_ids?.length) return NextResponse.json({ error: "location_ids required for internal roles" }, { status: 400 });
    } else if (role === "SUPERADMIN" && !isSuper(callerEmail)) {
      return NextResponse.json({ error: "Only SUPERADMIN can invite SUPERADMIN" }, { status: 403 });
    }

    if (callerRole === "OFFICE" && callerProfile?.company_id !== company_id) {
      return NextResponse.json({ error: "Cross-company invite not allowed for OFFICE." }, { status: 403 });
    }

    if (customer_id) {
      const { data: cust, error: ce } = await server
        .from("company_customers")
        .select("id, company_id")
        .eq("id", customer_id)
        .maybeSingle();
      if (ce) throw ce;
      if (!cust || cust.company_id !== company_id) {
        return NextResponse.json({ error: "customer_not_in_company" }, { status: 400 });
      }
    }
    if (location_ids?.length) {
      const { data: locs, error: le } = await server
        .from("company_locations")
        .select("id, company_id")
        .in("id", location_ids);
      if (le) throw le;
      const bad = (locs || []).some((l) => l.company_id !== company_id);
      if (bad) return NextResponse.json({ error: "location_not_in_company" }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const meta: Record<string, any> = {
      role, company_id, customer_id,
      location_id: location_ids?.[0] || null,
      account_name, account_number, contact_name, contact_phone,
      invited_by: callerEmail,
    };

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: meta });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (data?.user) {
      const upsert: any = {
        id: data.user.id,
        email,
        role,
        company_id,
        customer_id: role === "CUSTOMER" ? customer_id : null,
        location_ids:
          role === "CUSTOMER" ? (location_ids?.length ? location_ids : null)
          : (["OFFICE","DISPATCH","TECH","ADMIN"].includes(role) ? location_ids : null),
        account_name, account_number, contact_name, contact_phone,
      };
      await server.from("profiles").upsert(upsert, { onConflict: "id" });

      // Audit
      await server.from("audit_user_events").insert({
        actor_id: caller.id,
        actor_email: callerEmail,
        target_id: data.user.id,
        target_email: email,
        action: "invite",
        payload: { role, company_id, customer_id, location_ids },
      });
    }

    return NextResponse.json({
      ok: true,
      invited: email,
      role,
      company_id,
      customer_id,
      location_ids,
      account_name,
      account_number,
      contact_name,
      contact_phone,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
