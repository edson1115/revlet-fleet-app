import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/* ============================================================
   POST — Add Vehicle (Office)
============================================================ */
export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    /* ---------------- AUTH ---------------- */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* ---------------- ROLE CHECK ---------------- */
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json(
        { ok: false, error: "Profile not found" },
        { status: 403 }
      );
    }

    const ALLOWED = new Set(["OFFICE", "ADMIN", "SUPERADMIN"]);

    if (!ALLOWED.has(profile.role)) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    /* ---------------- INPUT ---------------- */
    const body = await req.json();

    const {
      customer_id,
      year,
      make,
      model,
      unit_number,
      plate,
      vin,
    } = body;

    if (!customer_id || !year || !make || !model) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* ---------------- INSERT ---------------- */
    const { data: vehicle, error: insertErr } = await supabase
      .from("vehicles")
      .insert({
        customer_id,
        year,
        make,
        model,
        unit_number: unit_number ?? null,
        plate: plate ?? null,
        vin: vin ?? null,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Vehicle insert error:", insertErr);
      return NextResponse.json(
        { ok: false, error: "Failed to add vehicle" },
        { status: 500 }
      );
    }

    /* ---------------- SUCCESS ---------------- */
    return NextResponse.json({
      ok: true,
      vehicle,
    });
  } catch (err) {
    console.error("Add vehicle API error:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
