import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await supabaseServer();

    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? "Logout failed" },
      { status: 500 }
    );
  }
}
