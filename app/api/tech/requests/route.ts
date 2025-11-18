// app/api/tech/requests/route.ts

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/tech/requests
export async function GET(req: Request) {
  try {
    const supabase = await supabaseServer(); // ✅ FIXED

    // Authenticate user
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authData.user.id;

    // Look up company + technician profile for this user
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("company_id, technician_id")
      .eq("id", userId)
      .maybeSingle();

    if (profErr || !prof) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const { company_id, technician_id } = prof;

    if (!company_id || !technician_id) {
      return NextResponse.json(
        { error: "Technician profile incomplete" },
        { status: 400 }
      );
    }

    // Fetch service requests assigned to this tech
    const { data: rows, error: reqErr } = await supabase
      .from("service_requests")
      .select(
        `
          id,
          status,
          service,
          mileage,
          po,
          notes,
          dispatch_notes,
          scheduled_at,
          started_at,
          completed_at,
          customer:customer_id ( id, name ),
          vehicle:vehicle_id ( id, year, make, model, unit_number, plate ),
          location:location_id ( id, name )
        `
      )
      .eq("company_id", company_id)
      .eq("technician_id", technician_id)
      .order("created_at", { ascending: false });

    if (reqErr) {
      return NextResponse.json({ error: reqErr.message }, { status: 400 });
    }

    return NextResponse.json({ rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/tech/requests
export async function PATCH(req: Request) {
  try {
    const supabase = await supabaseServer(); // ✅ FIXED

    const body = await req.json();
    const { id, status, notes, mileage } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Validate user
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply update
    const { data, error: updErr } = await supabase
      .from("service_requests")
      .update({
        status: status ?? undefined,
        notes: notes ?? undefined,
        mileage: mileage ?? undefined,
        started_at:
          status === "IN_PROGRESS" ? new Date().toISOString() : undefined,
        completed_at:
          status === "COMPLETED" ? new Date().toISOString() : undefined,
      })
      .eq("id", id)
      .select()
      .single();

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
