import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();

    const form = await req.formData();

    const vehicle_id = form.get("vehicle_id") as string;
    const service = form.get("service") as string;

    const po_number = form.get("po_number") as string | null;
    const vendor = form.get("vendor") as string | null;
    const urgent = form.get("urgent") === "true";
    const key_drop = form.get("key_drop") === "true";
    const parking_location = form.get("parking_location") as string | null;
    const date_requested = form.get("date_requested") as string | null;

    // -------------------------
    // VALIDATE MINIMUM INPUT
    // -------------------------
    if (!vehicle_id) {
      return NextResponse.json({ error: "Missing vehicle_id" }, { status: 400 });
    }

    if (!service || !service.trim()) {
      return NextResponse.json({ error: "Missing service description" }, { status: 400 });
    }

    // -------------------------
    // GET CUSTOMER ID
    // -------------------------
    const { data: vehicle, error: vErr } = await supabase
      .from("vehicles")
      .select("customer_id")
      .eq("id", vehicle_id)
      .maybeSingle();

    if (vErr || !vehicle?.customer_id) {
      console.error(vErr);
      return NextResponse.json(
        { error: "Vehicle not found or missing customer_id" },
        { status: 400 }
      );
    }

    // -----------------------------------
    // INSERT THE MAIN SERVICE REQUEST
    // -----------------------------------
    const { data: newReq, error: insertErr } = await supabase
      .from("service_requests")
      .insert([
        {
          vehicle_id,
          customer_id: vehicle.customer_id,
          service,
          po_number,
          vendor,
          urgent,
          key_drop,
          parking_location,
          preferred_date: date_requested,
          status: "NEW",
        },
      ])
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return NextResponse.json(
        { error: "Insert failed", details: insertErr.message },
        { status: 500 }
      );
    }

    const requestId = newReq.id;

    // -----------------------------------
    // HANDLE IMAGES
    // -----------------------------------
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const photos = form.getAll("photos") as File[];

    for (const file of photos) {
      if (!file || typeof file === "string") continue;

      const ext = file.name.split(".").pop() || "jpg";
      const storagePath = `request-images/${requestId}-${Date.now()}.${ext}`;

      const array = new Uint8Array(await file.arrayBuffer());

      // Upload
      const { error: uploadErr } = await supabaseAdmin.storage
        .from("request-images")
        .upload(storagePath, array, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadErr) {
        console.error("Upload error:", uploadErr);
        continue;
      }

      const { data: pub } = supabaseAdmin.storage
        .from("request-images")
        .getPublicUrl(storagePath);

      // Insert DB row
      await supabaseAdmin.from("request_images").insert([
        {
          request_id: requestId,
          url_full: pub.publicUrl,
          url_thumb: pub.publicUrl,
        },
      ]);
    }

    return NextResponse.json({ ok: true, request_id: requestId });
  } catch (err: any) {
    console.error("CREATE REQUEST ERROR:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
