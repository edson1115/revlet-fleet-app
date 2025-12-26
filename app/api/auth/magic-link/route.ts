import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Next.js 15 — SAFE magic link handler
export async function POST(req: Request) {
  let body: any = {};

  // ✅ SAFE BODY PARSE (prevents crash)
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }

  const email =
    body.email ||
    new URL(req.url).searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Email required" },
      { status: 400 }
    );
  }

  // ✅ MUST await cookies() in Next.js 15
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookieStore.delete(name, options);
        },
      },
    }
  );

  const redirectTo =
    `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?redirect=/customer`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
