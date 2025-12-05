import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();

  // 1 — get user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2 — get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
  }

  // 3 — authorization
  if (profile.role !== "SUPERADMIN" && profile.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });
  }

  // 4 — return minimal data so UI stops crashing
  return NextResponse.json({
    ok: true,
    stats: {
      total_requests: 0,
      open_requests: 0,
      completed_today: 0,
      customers: 0,
      vehicles: 0,
      markets: 0,
    },
    users: [],
    techs: [],
    recent_requests: [],
  });
}
