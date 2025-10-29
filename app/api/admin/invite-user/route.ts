// app/api/admin/invite-user/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isSuperAdminEmail(email?: string | null) {
  const env = (process.env.SUPERADMIN_EMAILS || "")
    .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const fallback = "edson.cortes@bigo.com";
  const e = (email || "").toLowerCase();
  return !!e && (env.includes(e) || e === fallback);
}

type Body = {
  email: string;
  role: "CUSTOMER" | "OFFICE" | "DISPATCHER" | "TECH" | "ADMIN";
  name?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  location_id?: string | null; // optional scoping
};

export async function POST(req: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "supabaseKey is required" }, { status: 500 });
    }

    const body = (await req.json()) as Body;
    const email = (body.email || "").trim().toLowerCase();
    const role = String(body.role || "").toUpperCase() as Body["role"];
    const name = body.name?.trim() || null;
    const customer_id = body.customer_id || null;
    const customer_name = body.customer_name?.trim() || null;
    const location_id = body.location_id || null;

    if (!email || !role) {
      return NextResponse.json({ error: "email and role are required" }, { status: 400 });
    }

    // Auth: SUPERADMIN only
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const callerEmail = auth?.user?.email || null;
    if (!callerEmail || !isSuperAdminEmail(callerEmail)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // CUSTOMER needs either customer_id or customer_name
    if (role === "CUSTOMER" && !(customer_id || customer_name)) {
      return NextResponse.json({ error: "customer_id or customer_name is required for CUSTOMER" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    const userMetadata: Record<string, any> = {
      role,
      full_name: name,
      customer_id: role === "CUSTOMER" ? (customer_id ?? null) : null,
      location_id: location_id ?? null,
    };

    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: userMetadata,
    });
    if (inviteErr) return NextResponse.json({ error: inviteErr.message }, { status: 500 });

    const userId = invited?.user?.id || null;

    if (userId) {
      await supabase
        .from("profiles")
        .upsert(
          [{
            id: userId,
            email,
            full_name: name,
            role,
            customer_id: role === "CUSTOMER" ? (customer_id ?? null) : null,
          }],
          { onConflict: "id" as any }
        );
    }

    return NextResponse.json({ ok: true, invited_user_id: userId, email, role, location_id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "invite_failed" }, { status: 500 });
  }
}
