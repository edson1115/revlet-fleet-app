import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ============================================================
   GET — Load service requests for logged-in customer
============================================================ */
export async function GET(req: Request) {
  try {
    const scope = await resolveUserScope();

    if (!scope.uid || !scope.isCustomer) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || "20");
    const vehicleId = url.searchParams.get("vehicle_id");

    const supabase = await supabaseServer();

    let q = supabase
      .from("service_requests")
      .select(`
        id,
        vehicle_id,
        customer_id,
        service_type,
        mileage,
        status,
        notes,
        created_at,
        completed_at,
        vehicle:vehicles(id, year, make, model, plate)
      `)
      .eq("customer_id", scope.customer_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (vehicleId) q = q.eq("vehicle_id", vehicleId);

    const { data, error } = await q;

    if (error) {
      return NextResponse.json({ ok: false, error: error.message });
    }

    return NextResponse.json({ ok: true, rows: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}

/* ============================================================
   POST — Create new service request (FORM DATA VERSION)
============================================================ */
export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const form = await req.formData();

    const vehicle_id = form.get("vehicle_id")?.toString();
    const service_type = form.get("service_type")?.toString();
    const notes = form.get("notes")?.toString() ?? "";

    // ⭐ Mileage
    const mileageRaw = form.get("mileage")?.toString() ?? null;
    const mileage = mileageRaw ? Number(mileageRaw) : null;

    if (!vehicle_id || !service_type) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.customer_id) {
      return NextResponse.json(
        { ok: false, error: "Customer profile missing" },
        { status: 400 }
      );
    }

    // Insert service request
    const { data: reqRow, error: insertErr } = await supabase
      .from("service_requests")
      .insert([
        {
          customer_id: profile.customer_id,
          vehicle_id,
          service_type,
          mileage,
          notes,
          status: "NEW",
        },
      ])
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Photos
    const photos: File[] = [];
    form.forEach((v, key) => {
      if (key.startsWith("photo_") && v instanceof File) photos.push(v);
    });

    for (const file of photos) {
      await supabase.storage
        .from("request_photos")
        .upload(`${reqRow.id}/${Date.now()}-${file.name}`, file, {
          upsert: true,
        });
    }

    return NextResponse.json({ ok: true, request: reqRow });
  } catch (err: any) {
    console.error("REQUEST CREATE ERROR:", err);
    return NextResponse.json(
      { ok: false, error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
