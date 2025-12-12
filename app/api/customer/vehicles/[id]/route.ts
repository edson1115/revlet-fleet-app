import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function PUT(req: Request, ctx: any) {
  try {
    const { id } = await ctx.params;
    const supabase = await supabaseServer();
    const body = await req.json();

    const { mileage_override } = body;   // ⭐ ONLY THIS FIELD

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.customer_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ⭐ UPDATE ONLY THE MILEAGE COLUMNS
    const { error } = await supabase
      .from("vehicles")
      .update({
        mileage_override: mileage_override,
        last_reported_mileage: mileage_override,        // ⭐ add this
        last_mileage_at: new Date().toISOString(),      // ⭐ add this
      })
      .eq("id", id)
      .eq("customer_id", profile.customer_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });

  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
