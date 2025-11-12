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

  const { email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 });

  const admin = supabaseAdmin();

  // try invite; if already registered, fall back to recovery link
  const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(email);
  if (!invited?.user && invErr) {
    // attempt recovery link
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
    } as any);
    if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 });

    await supabase.from("admin_audit").insert({
      actor_email: gate.email || null,
      target_email: email,
      action: "RESEND",
      payload: { mode: "recovery_link" },
    });

    return NextResponse.json({ ok: true, mode: "recovery_link", link: linkData?.properties?.action_link || null });
  }

  await supabase.from("admin_audit").insert({
    actor_email: gate.email || null,
    target_email: email,
    action: "INVITE",
    payload: { mode: "invite" },
  });

  return NextResponse.json({ ok: true, mode: "invite" });
}
