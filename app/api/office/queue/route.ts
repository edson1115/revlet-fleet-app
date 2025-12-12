import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserAndRole, INTERNAL } from "@/lib/supabase/server-helpers";

/**
 * Returns queue of requests for Office:
 * NEW, WAITING, WAITING_FOR_APPROVAL, WAITING_FOR_PARTS
 */
export async function GET() {
  try {
    const { user, role } = await getUserAndRole();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (!role || !INTERNAL.has(role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const supabase = await supabaseServer();

    // Pull common "incoming" statuses; adjust to your enum set
    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .in("status", ["NEW", "WAITING", "WAITING_FOR_APPROVAL", "WAITING_FOR_PARTS"])
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
