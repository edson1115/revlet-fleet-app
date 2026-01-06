// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.warn("[auth/me] No session:", error.message);
      return NextResponse.json({ ok: true, user: null });
    }

    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    console.error("[auth/me] Fatal error:", err);
    return NextResponse.json(
      { ok: false, user: null, error: "Server error" },
      { status: 500 }
    );
  }
}
