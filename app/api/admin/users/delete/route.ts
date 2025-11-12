import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuper, isSuperAdminEmail } from "@/lib/admin/guard";


export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const gate = await requireSuper(supabase);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  // get email for audit
  const { data: prof } = await supabase.from("profiles").select("email").eq("id", id).maybeSingle();

  // delete auth user
  const admin = supabaseAdmin();
  const { error: delErr } = await admin.auth.admin.deleteUser(id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  // delete profile (best-effort)
  await supabase.from("profiles").delete().eq("id", id);

  // audit
  await supabase.from("admin_audit").insert({
    actor_email: gate.email || null,
    target_email: prof?.email || null,
    action: "DELETE",
    payload: { id },
  });

  return NextResponse.json({ ok: true });
}
