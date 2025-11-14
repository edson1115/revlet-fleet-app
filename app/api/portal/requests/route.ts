// app/api/portal/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;

    if (!uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("customer_id, role")
      .eq("id", uid)
      .maybeSingle();

    const role = (prof?.role || "").toUpperCase();
    const customerId = prof?.customer_id;

    if (!customerId) {
      return NextResponse.json({ rows: [] });
    }

    const qs = new URL(req.url);
    const status = qs.searchParams.get("status") || null;

    let q = supabase
      .from("service_requests")
      .select(
        `id, status, service, created_at, scheduled_at, completed_at,
         vehicle:vehicle_id ( unit_number, year, make, model, plate )`
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (status) {
      q = q.eq("status", status);
    }

    const { data, error } = await q;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
