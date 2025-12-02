// app/api/vehicles/route.ts
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

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || 500);

  let query = supabase
    .from("vehicles")
    .select("*")
    .limit(limit);

  // Role scoping
  if (scope.isCustomer) {
    query = query.eq("customer_id", scope.customer_id);
  } else if (scope.isInternal) {
    if (scope.markets.length > 0) {
      query = query.in("market", scope.markets);
    }
  } else if (scope.isTech) {
    return NextResponse.json(
      { ok: false, error: "Technicians cannot fetch vehicles" },
      { status: 403 }
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("/api/vehicles GET error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
