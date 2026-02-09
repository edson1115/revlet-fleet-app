import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserAndRole } from "@/lib/supabase/server-helpers";

// FIX: Define allowed roles locally to avoid type conflict with imported string constant
const DISPATCH_ROLES = ["admin", "manager", "dispatch", "executive", "support", "internal"];

export async function GET() {
  const { user, role } = await getUserAndRole();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // FIX: Use .includes() on our local array instead of .has()
  if (!role || !DISPATCH_ROLES.includes(role)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const supabase = await supabaseServer();

  // Fetch only requests waiting for dispatch
  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .eq("status", "WAITING") // requests approved by office
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, rows: data });
}