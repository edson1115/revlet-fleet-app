// app/api/admin/markets/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { roleToPermissions, normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await supabaseServer();

  // Get user
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = userRes.user.id;

  // Load profile to check role + company
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", userId)
    .maybeSingle();

  if (profErr || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole(profile.role);
  const perms = roleToPermissions(role);

  if (!perms.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Admin can see all markets
  const { data, error } = await supabase
    .from("markets")
    .select("id, name, state, created_at")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ markets: data }, { status: 200 });
}
