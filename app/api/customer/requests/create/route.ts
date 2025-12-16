// app/api/customer/requests/create/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    // ------------------------
    // 1. Parse incoming JSON
    // ------------------------
    const body = await req.json();

    const {
      vehicle_id,
      service_type,
      description,
      image_urls = [],
      ai_summary,
      ai_parts,
      ai_problem,
      ai_next_service,
    } = body;

    if (!vehicle_id) {
      return NextResponse.json(
        { ok: false, error: "Missing vehicle_id" },
        { status: 400 }
      );
    }

    // ------------------------
    // 2. Validate user session
    // ------------------------
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ------------------------
    // 3. Load user profile
    // ------------------------
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id, role, customer_id")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json(
        { ok: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    if (profile.role !== "CUSTOMER") {
      return NextResponse.json(
        { ok: false, error: "Only customers can submit requests" },
        { status: 403 }
      );
    }

    // ------------------------
    // 4. Insert service request
    // ------------------------
    const { data: inserted, error: insertErr } = await supabase
      .from("service_requests")
      .insert({
        customer_id: profile.customer_id,
        vehicle_id,
        service_type,
        description,
        status: "NEW", // default status
        photos: image_urls, // array of URLs
        ai_summary,
        ai_parts,
        ai_problem,
        ai_next_service,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return NextResponse.json(
        { ok: false, error: insertErr.message },
        { status: 500 }
      );
    }

    // ------------------------
    // 5. Return new request ID
    // ------------------------
    return NextResponse.json({
      ok: true,
      id: inserted.id,
    });
  } catch (err) {
    console.error("CREATE REQUEST API ERROR:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
