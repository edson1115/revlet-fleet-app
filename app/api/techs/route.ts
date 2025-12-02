// app/api/techs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = supabaseServer();
  const scope = await resolveUserScope();

  if (!scope.uid) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  if (!scope.isInternal) {
    return NextResponse.json(
      { ok: false, error: "Access denied" },
      { status: 403 }
    );
  }

  // Filter active techs only
  let query = supabase
    .from("profiles")
    .select("id, full_name, role, active, market")
    .eq("role", "TECH")
    .eq("active", true);

  // Market scoping
  if (scope.markets.length > 0) {
    query = query.in("market", scope.markets);
  }

  const { data, error } = await query;

  if (error) {
    console.error("/api/techs GET error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, techs: data });
}
