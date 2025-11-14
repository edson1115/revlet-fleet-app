// app/api/portal/vehicles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const customer_id = prof?.customer_id;

    if (!customer_id) {
      return NextResponse.json({ vehicles: [] });
    }

    const { data: vehicles, error } = await supabase
      .from("vehicles")
      .select("id, year, make, model, plate, unit_number")
      .eq("customer_id", customer_id)
      .order("unit_number", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vehicles: vehicles ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
