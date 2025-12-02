// app/auth/callback/finish/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=no_code", SITE_URL)
    );
  }

  const supabase = supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Callback exchange error:", error);
    return NextResponse.redirect(
      new URL("/login?error=callback_failed", SITE_URL)
    );
  }

  return NextResponse.redirect(new URL(next, SITE_URL));
}
