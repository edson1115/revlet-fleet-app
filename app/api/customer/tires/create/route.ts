import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    // --- AUTH ---
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // --- PROFILE -> CUSTOMER_ID ---
    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.customer_id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized (no customer id)" },
        { status: 403 }
      );
    }

    const form = await req.formData();

    const tire_size = form.get("tire_size") as string;
    const tire_brand = form.get("tire_brand") as string | null;
    const tire_model = form.get("tire_model") as string | null;
    const tire_quantity = Number(form.get("tire_quantity") || 0);
    const po_number = form.get("po_number") as string | null;
    const dropoff_address = form.get("dropoff_address") as string;

    // INSERT NEW REQUEST
    const { data, error } = await supabase
      .from("service_requests")
      .insert({
        type: "TIRE_PURCHASE",
        customer_id: profile.customer_id,
        vehicle_id: null,
        service: null,
        mileage: null,
        urgent: false,
        key_drop: false,

        tire_size,
        tire_brand,
        tire_model,
        tire_quantity,
        po: po_number,
        dropoff_address,

        status: "NEW",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("TIRE CREATE ERROR:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      request_id: data?.id,
    });

  } catch (err: any) {
    console.error("TIRE CREATE CRASH:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
