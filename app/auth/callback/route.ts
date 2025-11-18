// app/auth/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect("/auth/error?reason=missing_code");
  }

  // MUST AWAIT — FIXES YOUR ERROR
  const supabase = await supabaseServer();

  // Complete OAuth exchange
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(
      "/auth/error?reason=exchange_failed"
    );
  }

  // Success – send user to dashboard
  return NextResponse.redirect("/dashboard");
}
