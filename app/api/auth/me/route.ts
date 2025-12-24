import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  /* -------------------------------------------------
     LOAD PROFILE (ROLE + MARKET)
  ------------------------------------------------- */
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, market")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { ok: false, error: "Profile not found" },
      { status: 403 }
    );
  }

  /* -------------------------------------------------
     ✅ NORMALIZE ROLE (CRITICAL)
  ------------------------------------------------- */
  const role = String(profile.role || "USER").toUpperCase();

  /* -------------------------------------------------
     🔒 MARKET LOCK (MATCH DB + UI)
  ------------------------------------------------- */
  const market = "SAN_ANTONIO";

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      role,
      market,
    },
  });
}
