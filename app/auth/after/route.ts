// app/auth/after/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

const ROLE_LANDING: Record<string, string> = {
  ADMIN: "/admin",
  OFFICE: "/office/queue",
  DISPATCH: "/dispatch/scheduled",
  TECH: "/tech/queue",
  CUSTOMER: "/fm/requests/new",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next");

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", url.origin));

  // read role from your profiles table
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // honor ?next= if provided
  if (next) return NextResponse.redirect(new URL(next, url.origin));

  const role = (prof?.role ?? "") as keyof typeof ROLE_LANDING;
  const target = ROLE_LANDING[role] ?? "/";
  return NextResponse.redirect(new URL(target, url.origin));
}



