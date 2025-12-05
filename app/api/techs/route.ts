// app/api/techs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await supabaseServer();
  const scope = await resolveUserScope();

  if (!scope.uid) {
    return NextResponse.json(
      { ok: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  // SUPERADMIN, OFFICE, DISPATCH can read TECH profiles
  const allowed = ["SUPERADMIN", "OFFICE", "DISPATCH"];
  if (!allowed.includes(scope.role)) {
    return NextResponse.json(
      { ok: false, error: "Forbidden: insufficient permissions" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("role", "TECH")
    .eq("active", true);

  if (error) {
    console.error("GET /api/techs error:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, rows: data });
}



