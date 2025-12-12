import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await supabaseServer();

    // Load logged-in user
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized user" },
        { status: 401 }
      );
    }

    // Load profile
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json(
        { ok: false, error: "Profile not found" },
        { status: 400 }
      );
    }

    if (!profile.customer_id) {
      return NextResponse.json(
        { ok: false, error: "customer_id missing on profile" },
        { status: 400 }
      );
    }

    // Load vehicles for this customer
    const { data: vehicles, error: vehErr } = await supabase
      .from("vehicles")
      .select("*")
      .eq("customer_id", profile.customer_id);

    if (vehErr) {
      return NextResponse.json(
        { ok: false, error: vehErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, vehicles });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
