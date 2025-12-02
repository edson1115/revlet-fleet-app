import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function POST() {
  const supabase = await supabaseServer();
  const scope = await resolveUserScope();

  if (!scope.isCustomer) return NextResponse.json({ ok: true });

  await supabase
    .from("activity_feed")
    .update({ seen: true })
    .eq("customer_id", scope.customer_id)
    .eq("seen", false);

  return NextResponse.json({ ok: true });
}
