// app/api/auth/set-session/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  try {
    const { access_token, refresh_token } = await req.json();

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
    }

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
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    // 🔥 THIS CREATES A REAL SESSION + COOKIE
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error || !data.user) {
      console.error("setSession failed:", error);
      return NextResponse.json({ error: "Auth failed" }, { status: 401 });
    }

    // Role-based redirect
    let redirectUrl = "/office";

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role = profile?.role?.toUpperCase();
    console.log(`[Set-Session] User: ${data.user.email} | Role: ${role}`);

    switch (role) {
      case "SUPERADMIN":
      case "ADMIN":
        redirectUrl = "/admin";
        break;
      case "OFFICE":
        redirectUrl = "/office";
        break;
      case "DISPATCH":
        redirectUrl = "/dispatch";
        break;
      case "TECH":
        redirectUrl = "/tech";
        break;
      case "CUSTOMER":
      case "CUSTOMER_USER":
        redirectUrl = "/portal";
        break;
    }

    return NextResponse.json({ success: true, redirectUrl });
  } catch (err: any) {
    console.error("Set-session fatal error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
