// app/api/auth/link-user/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Optional util: ensure a profile row exists for the current user.
 * No-op if profiles already has an entry.
 */
export async function POST() {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: prof } = await supabase.from("profiles").select("id").eq("id", uid).maybeSingle();
    if (!prof?.id) {
      const { error } = await supabase.from("profiles").insert({ id: uid });
      if (error) console.warn("[/api/auth/link-user] insert profile failed:", error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
