// app/api/portal/requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { resolveUserScope } from "@/lib/api/scope";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: any) {
  const supabase = supabaseServer();
  const scope = await resolveUserScope();
  const id = params.id;

  if (!scope.isCustomer) {
    return NextResponse.json({ ok: false, error: "Access denied" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("service_requests")
    .select(
      `
      *,
      customer:customers(*),
      location:locations(*),
      vehicle:vehicles(*),
      technician:profiles(full_name, id)
    `
    )
    .eq("id", id)
    .eq("customer_id", scope.customer_id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
