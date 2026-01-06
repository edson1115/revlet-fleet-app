import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

/* ========================================================================
   GET: List Requests
======================================================================== */
export async function GET() {
  try {
    // 1. Resolve Scope & Auth
    const scope = await resolveUserScope();
    if (!scope.uid || !scope.isCustomer) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await supabaseServer();

    // 2. 🔥 HARD ENFORCEMENT: Block actions until approved
    if (scope.role === "CUSTOMER") {
      const { data: customer } = await supabase
        .from("customers")
        .select("status")
        .eq("id", scope.customer_id)
        .single();

      if (customer?.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "Account pending approval" },
          { status: 403 }
        );
      }
    }

    // 3. Fetch requests
    const { data: requests, error } = await supabase
      .from("service_requests")
      .select(`
        *,
        vehicle:vehicles (
          year, make, model, plate, vin
        )
      `)
      .eq("customer_id", scope.customer_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ ok: true, rows: requests || [] });

  } catch (e: any) {
    console.error("FETCH ERROR:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

/* ========================================================================
   POST: Create Request
======================================================================== */
export async function POST(req: Request) {
  try {
    // 1. Resolve Scope & Auth
    const scope = await resolveUserScope();
    if (!scope.uid || !scope.isCustomer) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await supabaseServer();

    // 2. 🔥 HARD ENFORCEMENT: Block actions until approved
    if (scope.role === "CUSTOMER") {
      const { data: customer } = await supabase
        .from("customers")
        .select("status")
        .eq("id", scope.customer_id)
        .single();

      if (customer?.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "Account pending approval" },
          { status: 403 }
        );
      }
    }

    // 3. Parse Body
    const body = await req.json(); 
    const {
      vehicle_id,
      service_title,
      service_description,
      reported_mileage,
      photo_urls
    } = body;

    if (!vehicle_id) return NextResponse.json({ ok: false, error: "Vehicle is required" }, { status: 400 });

    // 4. Create Request
    const { data: request, error: reqError } = await supabase
      .from("service_requests")
      .insert({
        customer_id: scope.customer_id,
        vehicle_id,
        service_title: service_title || "General Service",
        service_description: service_description,
        reported_mileage: reported_mileage || null,
        status: "NEW",
        created_by_role: "CUSTOMER",
      })
      .select()
      .single();

    if (reqError) throw new Error(reqError.message);

    // 5. Link Photos
    if (photo_urls && Array.isArray(photo_urls) && photo_urls.length > 0) {
      const imageRows = photo_urls.map((url) => ({
        request_id: request.id,
        url_full: url,
        uploaded_by: scope.uid
      }));

      await supabase.from("request_images").insert(imageRows);
    }

    return NextResponse.json({ ok: true, request });

  } catch (err: any) {
    console.error("CREATE ERROR:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}