import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// ✅ NEW PATHS
const ROLE_LANDING: Record<string, string> = {
  SUPERADMIN: "/admin",
  ADMIN: "/admin",
  OFFICE: "/office",     // Was /office/queue
  DISPATCH: "/dispatch", // Was /dispatch/scheduled
  TECH: "/tech",         // Was /tech/queue
  CUSTOMER: "/customer",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next");

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", url.origin));

  // If specific destination requested (e.g. ?next=/tech/requests/123), go there
  if (next) return NextResponse.redirect(new URL(next, url.origin));

  // Otherwise, go to Role Dashboard
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = (profile?.role || "CUSTOMER").toUpperCase();
  const target = ROLE_LANDING[role] ?? "/customer";

  return NextResponse.redirect(new URL(target, url.origin));
}