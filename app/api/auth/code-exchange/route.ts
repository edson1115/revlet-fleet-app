// app/api/auth/code-exchange/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer"; // or your server client

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code); // <— pass string

  if (error) {
    console.warn("[/api/auth/code-exchange] exchange failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/", req.url));
}
