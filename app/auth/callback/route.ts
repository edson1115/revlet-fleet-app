// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const HOME: Record<string, string> = {
  SUPERADMIN: "/admin/dashboard",
  ADMIN: "/admin/dashboard",
  DISPATCH: "/dispatch/scheduled",
  OFFICE: "/office/queue",
  TECH: "/tech/queue",
  CUSTOMER: "/customer",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
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

  const code = url.searchParams.get("code");

  // Exchange code → create session cookie
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin)
      );
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  // Load or create profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      role: "CUSTOMER",
      active: true,
    });
  }

  const role = (profile?.role || "CUSTOMER").toUpperCase();
  const home = HOME[role] || "/";

  return NextResponse.redirect(new URL(home, url.origin));
}
