// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");

  if (!code) return NextResponse.redirect(new URL("/login", url.origin));

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code); // <-- pass string

  if (error) {
    // revert any temp error text once you confirm everything
    return NextResponse.redirect(new URL("/?auth=error", url.origin));
  }

  // hop to a post-auth router to decide destination by role
  const dest = new URL("/auth/after", url.origin);
  if (next) dest.searchParams.set("next", next);
  return NextResponse.redirect(dest);
}
