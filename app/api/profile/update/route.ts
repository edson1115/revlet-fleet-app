import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const admin = supabaseAdmin();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { full_name, phone, email, password } = body;

    // Update profile table data
    await admin
      .from("profiles")
      .update({
        full_name,
        phone,
      })
      .eq("id", user.id);

    // Email change = requires magic link
    if (email && email !== user.email) {
      await admin.auth.admin.updateUserById(user.id, { email });
      return NextResponse.json({
        ok: true,
        email_change_requires_magic_link: true,
      });
    }

    // Password update
    if (password) {
      await admin.auth.admin.updateUserById(user.id, { password });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
