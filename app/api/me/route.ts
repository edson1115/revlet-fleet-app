// app/api/me/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { authenticated: false, email: null, role: null, customer_id: null, company_id: null },
      { status: 200 }
    );
  }

  // Defaults from auth metadata
  let role = (user.app_metadata as any)?.role ?? null;
  let customer_id = null;
  let company_id = (user.user_metadata as any)?.company_id ?? null;

  // Try profiles.* if table exists; ignore if missing
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("company_id, role, customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && profile) {
      role = profile.role ?? role;
      customer_id = profile.customer_id ?? customer_id;
      company_id = profile.company_id ?? company_id;
    }
  } catch {
    // profiles table may not exist yet; that's fine
  }

  return NextResponse.json(
    { authenticated: true, email: user.email, role, customer_id, company_id },
    { status: 200 }
  );
}
