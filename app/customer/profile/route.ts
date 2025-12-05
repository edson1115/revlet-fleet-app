// app/api/customer/profile/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Load profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, phone, customer_id, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { ok: false, error: "Profile not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    profile,
  });
}
