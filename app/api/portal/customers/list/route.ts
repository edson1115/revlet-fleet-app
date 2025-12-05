// app/api/portal/customers/list/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ------------------------------------------------------------
// GET /api/portal/customers/list
// Returns list of customers + fleet metrics
// ------------------------------------------------------------
export async function GET() {
  try {
    const supabase = await supabaseServer();

    // Auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const role = normalizeRole(user.user_metadata?.role);

    const INTERNAL = new Set([
      "OFFICE",
      "DISPATCH",
      "ADMIN",
      "SUPERADMIN",
      "FLEET_MANAGER",
    ]);

    if (!role || !INTERNAL.has(role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------
    // Combined customer list with vehicle + request aggregates
    // ------------------------------------------------------------

    const { data, error } = await supabase.rpc("get_customer_list");

    if (error) {
      console.error("RPC error:", error);
      return NextResponse.json(
        { error: "Failed loading customers" },
        { status: 500 }
      );
    }

    return NextResponse.json({ customers: data ?? [] });
  } catch (err: any) {
    console.error("CUSTOMER LIST ERROR:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}



