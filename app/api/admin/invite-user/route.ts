// app/api/admin/invite-user/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPERADMINS = (process.env.SUPERADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export async function POST(req: Request) {
  // who is calling
  const server = await supabaseServer();
  const {
    data: { user: authedUser },
  } = await server.auth.getUser();

  if (!authedUser) {
    return NextResponse.json({ error: "Auth session missing." }, { status: 401 });
  }

  const callerEmail = (authedUser.email || "").toLowerCase();
  const isSuper = SUPERADMINS.includes(callerEmail);

  // get caller profile if exists
  const { data: callerProfile } = await server
    .from("profiles")
    .select("id, role, company_id")
    .eq("id", authedUser.id)
    .maybeSingle();

  const callerRole = isSuper
    ? "SUPERADMIN"
    : String(callerProfile?.role || "CUSTOMER").toUpperCase();

  // parse body
  const body = await req.json().catch(() => ({} as any));

  const email = String(body?.email || "").trim().toLowerCase();
  const role = String(body?.role || "CUSTOMER").toUpperCase();

  // business fields you wanted:
  const account_name = body?.account_name ? String(body.account_name) : null;
  const account_number = body?.account_number ? String(body.account_number) : null;
  const contact_name = body?.contact_name ? String(body.contact_name) : null;
  const contact_phone = body?.contact_phone ? String(body.contact_phone) : null;
  const location_id = body?.location_id ? String(body.location_id) : null;

  // customer_id = which fleet customer this person belongs to
  const customer_id = body?.customer_id ? String(body.customer_id) : null;

  // company_id — super can set, others inherit
  const company_id =
    (isSuper && body?.company_id) ||
    callerProfile?.company_id ||
    String(body?.company_id || "");

  if (!email) {
    return NextResponse.json({ error: "Email required." }, { status: 400 });
  }
  if (!company_id) {
    return NextResponse.json({ error: "company_id required." }, { status: 400 });
  }

  // permissions
  if (!["SUPERADMIN", "ADMIN", "OFFICE"].includes(callerRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // office can only invite inside their own company
  if (callerRole === "OFFICE" && callerProfile?.company_id !== company_id) {
    return NextResponse.json(
      { error: "Cross-company invite not allowed for OFFICE." },
      { status: 403 }
    );
  }

  // send invite
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      role,
      company_id,
      customer_id,
      location_id,
      account_name,
      account_number,
      contact_name,
      contact_phone,
    },
    // redirectTo: process.env.NEXT_PUBLIC_SITE_URL + "/auth/callback",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // seed profile right now
  if (data?.user) {
    await server.from("profiles").upsert(
      {
        id: data.user.id,
        email,
        role,
        company_id,
        customer_id,
        location_id,
        account_name,
        account_number,
        contact_name,
        contact_phone,
      },
      { onConflict: "id" }
    );
  }

  return NextResponse.json({
    ok: true,
    invited: email,
    role,
    company_id,
    customer_id,
    location_id,
    account_name,
    account_number,
    contact_name,
    contact_phone,
  });
}
