// app/api/auth/token-exchange/route.ts
import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Supports ?code=... (same as code-exchange), with optional ?redirect=/path
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const redirectTo = url.searchParams.get("redirect") || "/";

    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession({ authCode: code });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.redirect(new URL(redirectTo, req.url));
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
