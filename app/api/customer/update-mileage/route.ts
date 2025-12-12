import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { vehicle_id, mileage } = await req.json();
    const supabase = await supabaseServer();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("vehicles")
      .update({
        mileage_override: mileage,
        last_reported_mileage: mileage,
        last_mileage_at: new Date().toISOString(),
      })
      .eq("id", vehicle_id);

    if (error) {
      console.error("Mileage update error:", error);
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });

  } catch (e) {
    console.error("Exception updating mileage", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
