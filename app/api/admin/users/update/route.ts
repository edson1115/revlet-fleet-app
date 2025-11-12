import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSuper, isSuperAdminEmail } from "@/lib/admin/guard";


const ALLOWED = new Set(["SUPERADMIN","ADMIN","OFFICE","DISPATCH","TECH","CUSTOMER"]);

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const gate = await requireSuper(supabase);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await req.json().catch(() => ({}));
  const { id, role, customer_id, location_ids } = body || {};

  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });
  const roleU = String(role || "").toUpperCase();
  if (!ALLOWED.has(roleU)) return NextResponse.json({ error: "invalid_role" }, { status: 400 });

  // enforce role-specific fields
  let patch: any = { role: roleU };
  if (roleU === "CUSTOMER") {
    if (!customer_id) return NextResponse.json({ error: "customer_id required for CUSTOMER" }, { status: 400 });
    patch.customer_id = customer_id;
    patch.location_ids = Array.isArray(location_ids) ? location_ids : [];
  } else if (["OFFICE","DISPATCH","TECH","ADMIN"].includes(roleU)) {
    const locs = Array.isArray(location_ids) ? location_ids : [];
    if (!locs.length) return NextResponse.json({ error: "location_ids required for internal roles" }, { status: 400 });
    patch.customer_id = null;
    patch.location_ids = locs;
  } else if (roleU === "SUPERADMIN") {
    patch.customer_id = null;
    patch.location_ids = [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select("email, role")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // audit
  await supabase.from("admin_audit").insert({
    actor_email: gate.email || null,
    target_email: data?.email || null,
    action: "UPDATE",
    payload: patch,
  });

  return NextResponse.json({ ok: true });
}
