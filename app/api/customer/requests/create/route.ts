// app/api/customer/requests/create/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// MULTIPART ROUTE
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    // AUTH
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // PROFILE (customer_id)
    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.customer_id)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });

    // PARSE FORM DATA
    const form = await req.formData();

    const vehicle_id = form.get("vehicle_id") as string;
    const service = form.get("service") as string;
    const requested_date = form.get("requested_date") as string;

    const mileage_str = form.get("mileage") as string;
    const mileage = mileage_str ? Number(mileage_str) : null;

    const po_number = form.get("po_number") as string | null;
    const vendor = form.get("vendor") as string | null;
    const urgent = form.get("urgent") === "true";
    const key_drop = form.get("key_drop") === "true";
    const parking_location = form.get("parking_location") as string | null;

    // INSERT REQUEST — ⭐ FIXED (MILEAGE SAVED)
    const { data, error } = await supabase
      .from("service_requests")
      .insert({
        customer_id: profile.customer_id,
        vehicle_id,
        service,
        mileage,             // ⭐ IMPORTANT
        po: po_number,
        fmc: vendor,
        urgent,
        key_drop,
        parking_location,
        created_at: new Date().toISOString(),
        requested_date,
        status: "NEW",
      })
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("CREATE REQUEST ERROR:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    const request_id = data?.id;

    return NextResponse.json({ ok: true, request_id });
  } catch (err: any) {
    console.error("CREATE REQUEST CRASH:", err);
    return NextResponse.json(
      { ok: false, error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
