// app/api/auth/code-exchange/route.ts
import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const redirectTo = url.searchParams.get("redirect") || "/";

    if (!code) {
      // No code, just go home
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }

    const supabase = await supabaseServer();

    // v2 API
    const { error } = await supabase.auth.exchangeCodeForSession({ authCode: code });
    if (error) {
      console.warn("[/api/auth/code-exchange] exchange failed:", error.message);
    }

    return NextResponse.redirect(new URL(redirectTo, req.url));
  } catch (e: any) {
    console.error("[/api/auth/code-exchange] error:", e?.message ?? e);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
