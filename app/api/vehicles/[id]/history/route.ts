import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr"; // Use explicit client
import { cookies } from "next/headers";

export async function GET(req: Request, context: any) {
  // ✅ Next.js 15: Await the params
  const { id } = await context.params;

  // ✅ Next.js 15: Await the cookies
  const cookieStore = await cookies();

  // Create Client Directly (Bypassing potential helper issues)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in route handlers
          }
        },
      },
    }
  );

  try {
    // 1. AUTH CHECK
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("API Auth Error:", authError); // Log the actual error
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. GET CUSTOMER ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.customer_id) {
      return NextResponse.json(
        { ok: false, error: "Orphan User: No Linked Company" },
        { status: 403 }
      );
    }

    // 3. LOAD VEHICLE + HISTORY
    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .select(
        `
        id,
        make,
        model,
        year,
        unit_number,
        plate,
        vin,
        
        service_requests (
          id,
          status,
          service_title, 
          description,
          mileage,
          created_at,
          scheduled_date,
          completed_at,
          technician_notes
        )
      `
      )
      .eq("id", id)
      .eq("customer_id", profile.customer_id)
      .maybeSingle();

    if (error) {
      console.error("Fetch Error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    if (!vehicle) {
      return NextResponse.json(
        { ok: false, error: "Vehicle not found" },
        { status: 404 }
      );
    }

    // 4. SORT HISTORY
    const sortedRequests = (vehicle.service_requests || []).sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      ok: true,
      vehicle: {
        ...vehicle,
        service_requests: sortedRequests,
      },
    });
  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}