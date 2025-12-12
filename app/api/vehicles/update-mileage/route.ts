import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { vehicle_id, mileage } = await req.json();

    const supabase = await supabaseServer();

    const { error } = await supabase
      .from("vehicles")
      .update({ mileage_override: mileage })
      .eq("id", vehicle_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
