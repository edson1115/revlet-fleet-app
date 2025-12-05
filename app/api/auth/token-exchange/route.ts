// app/api/auth/token-exchange/route.ts
import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { access_token, refresh_token, next = "/" } = await req.json();

  if (!access_token || !refresh_token) {
    return NextResponse.json(
      { error: "Missing access or refresh token" },
      { status: 400 }
    );
  }

  // ⭐ FIX: supabaseServer MUST be awaited
  const supabase = await supabaseServer();

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Redirect to the provided route
  const url = new URL(next, new URL(req.url).origin);
  return NextResponse.redirect(url);
}



