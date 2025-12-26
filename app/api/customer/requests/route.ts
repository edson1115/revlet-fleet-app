import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/* ========================================================================
   GET: List Requests (With Safety Check for Customer ID)
======================================================================== */
export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    // 1. Get the Auth User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // 2. SAFETY CHECK: Find the Customer ID for this User
    // We query the profile to ensure we have the correct link
    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.customer_id) {
      console.error("PROFILE ERROR: No customer_id linked to user", user.id);
      // Return empty list instead of crashing
      return NextResponse.json({ ok: true, rows: [] });
    }

    // 3. Now fetch the requests using the confirmed ID
    const { data: requests, error } = await supabase
      .from("service_requests")
      .select(`
        *,
        vehicle:vehicles (
          year, make, model, plate, vin
        )
      `)
      .eq("customer_id", profile.customer_id)
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
    const supabase = await supabaseServer();
    
    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // 2. Find Customer ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.customer_id) {
      return NextResponse.json({ ok: false, error: "No customer linked to account" }, { status: 403 });
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

    // ... inside export async function POST(req: Request) ...

    // 4. Create Request
    const { data: request, error: reqError } = await supabase
      .from("service_requests")
      .insert({
        customer_id: profile.customer_id,
        vehicle_id,
        service_title: service_title || "General Service",
        service_description: service_description,
        reported_mileage: reported_mileage || null,
        status: "NEW",
        created_by_role: "CUSTOMER",
        // market_id: "SAN_ANTONIO"  <-- ❌ DELETE OR COMMENT THIS LINE
      })
      .select()
      .single();

// ... rest of file

    if (reqError) throw new Error(reqError.message);

    // 5. Link Photos
    if (photo_urls && Array.isArray(photo_urls) && photo_urls.length > 0) {
      const imageRows = photo_urls.map((url) => ({
        request_id: request.id,
        url_full: url,
        uploaded_by: user.id
      }));

      await supabase.from("request_images").insert(imageRows);
    }

    return NextResponse.json({ ok: true, request });

  } catch (err: any) {
    console.error("CREATE ERROR:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}