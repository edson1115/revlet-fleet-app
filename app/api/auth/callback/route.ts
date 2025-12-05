// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Role → Landing page
const HOME: Record<string, string> = {
  SUPERADMIN: "/admin/dashboard",
  ADMIN: "/admin/dashboard",
  DISPATCH: "/dispatch",
  OFFICE: "/office",
  TECH: "/tech",
  CUSTOMER: "/customer",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next");

  const supabase = await supabaseServer();

  // 1) Load session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // No session → send back to sign-in
    return NextResponse.redirect(new URL("/auth/signin", url.origin));
  }

  // 2) Ensure profile exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Auto-create if missing
  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      role: "CUSTOMER", // safe default
      active: true,
    });
  }

  const role = (profile?.role || "CUSTOMER").toUpperCase();

  // Validate mapped home route
  const home = HOME[role] || "/";

  // 3) NEXT param override
  if (next) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  // 4) Redirect user to role home
  return NextResponse.redirect(new URL(home, url.origin));
}
