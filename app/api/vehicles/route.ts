// app/api/vehicles/route.ts
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

    const url = new URL(req.url);
    const filterCustomerId = url.searchParams.get("customer_id");

    let q = supabase
      .from("vehicles")
      .select("id, year, make, model, plate, unit_number, customer_id")
      .order("unit_number", { ascending: true });

    if (role.startsWith("CUSTOMER") || role === "CLIENT") {
      if (!customerId) {
        return NextResponse.json({ rows: [] });
      }
      q = q.eq("customer_id", customerId);
    } else {
      if (filterCustomerId) q = q.eq("customer_id", filterCustomerId);
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
