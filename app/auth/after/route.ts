// app/auth/after/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

const ROLE_LANDING: Record<string, string> = {
  SUPERADMIN: "/admin",
  ADMIN: "/admin",
  OFFICE: "/office/queue",
  DISPATCH: "/dispatch/scheduled",
  TECH: "/tech/queue",
  CUSTOMER: "/customer",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next");

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // If ?next= exists → always honor it
  if (next) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const role = (profile?.role || "CUSTOMER").toUpperCase();
  const target = ROLE_LANDING[role] ?? "/";

  return NextResponse.redirect(new URL(target, url.origin));
}
