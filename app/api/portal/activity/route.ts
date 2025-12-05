// app/api/portal/activity/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function GET(req: NextRequest) {
  const supabase = await supabaseServer();
  const scope = await resolveUserScope();

  if (!scope.isCustomer) {
    return NextResponse.json({ ok: false, error: "Access denied" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("portal_activity")
    .select("*")
    .eq("customer_id", scope.customer_id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}



