import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function PUT(req: Request, ctx: any) {
  try {
    const { id } = ctx.params;
    const supabase = await supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const mileage = parseInt(body.mileage || 0);

    if (!mileage || isNaN(mileage)) {
      return NextResponse.json(
        { error: "Mileage required" },
        { status: 400 }
      );
    }

    // Get customer id
    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.customer_id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update mileage
    const { error } = await supabase
      .from("vehicles")
      .update({
        mileage_override: mileage,
        last_reported_mileage: mileage,
        last_mileage_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("customer_id", profile.customer_id);

    if (error) {
      console.error("Mileage update error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, mileage });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
