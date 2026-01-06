import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function GET() {
  const scope = await resolveUserScope();
  
  if (!scope.uid) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await supabaseServer();

  // 🔥 HARD ENFORCEMENT: Block data read until approved
  if (scope.role === "CUSTOMER" && scope.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("status")
      .eq("id", scope.customer_id)
      .single();

    if (customer?.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Account pending approval" },
        { status: 403 }
      );
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", scope.uid)
    .maybeSingle();

  return NextResponse.json({ ok: true, profile });
}