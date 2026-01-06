import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function GET() {
  const scope = await resolveUserScope();

  if (!scope.uid || !["ADMIN", "SUPERADMIN"].includes(scope.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("status", "PENDING_REVIEW")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, rows: data });
}
