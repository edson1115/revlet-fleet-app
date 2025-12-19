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
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  /* -------------------------------------------------
     LOAD PROFILE (ROLE + MARKET)
  ------------------------------------------------- */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, market")
    .eq("id", user.id)
    .single();

  /* -------------------------------------------------
     🔒 HARD MARKET LOCK (SAFE)
     Only San Antonio allowed for now
  ------------------------------------------------- */
  const LOCKED_MARKET = "San Antonio";

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      role: profile?.role ?? "USER",

      // 🔒 force market
      market: LOCKED_MARKET,
    },
  });
}
