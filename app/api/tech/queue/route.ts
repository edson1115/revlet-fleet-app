import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserAndRole } from "@/lib/supabase/server-helpers";

export async function GET() {
  const { user, role } = await getUserAndRole();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (role !== "TECH") return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .eq("tech_id", user.id)
    .in("status", ["SCHEDULED", "IN_PROGRESS"])
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, error }, { status: 500 });

  return NextResponse.json({ ok: true, rows: data });
}
