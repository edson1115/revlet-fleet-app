import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch { }
          },
        },
      }
    );

    // 1. Get Auth User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. FETCH PROFILE (Single Source of Truth)
    // We do NOT rely on the session token 'scope' here. We grab the real DB ID.
    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.customer_id) {
        return NextResponse.json({ ok: false, error: "No Customer ID linked to your profile." }, { status: 403 });
    }

    const body = await req.json();
    const { tire_size, quantity, po_number, location_name, notes } = body;

    // 3. Construct Description
    const description = `
      TIRE PROCUREMENT
      ----------------
      Size: ${tire_size}
      Qty: ${quantity}
      Drop-off: ${location_name || "N/A"}
      PO #: ${po_number || "N/A"}
      
      Notes:
      ${notes || "None"}
    `.trim();

    // 4. Insert Request
    const { data: request, error: reqError } = await supabase
      .from("service_requests")
      .insert({
        customer_id: profile.customer_id, // ✅ GUARANTEED MATCH
        vehicle_id: null,
        service_title: "Tire Purchase",
        service_description: description,
        description: description,
        status: "NEW",
        created_by: user.id,
        created_by_role: "CUSTOMER"
      })
      .select()
      .single();

    if (reqError) throw reqError;

    // 5. Insert Part Line Item
    if (request && quantity > 0) {
        const itemName = `Tire: ${tire_size}`;
        
        const { error: partError } = await supabase
            .from("request_parts")
            .insert({
                request_id: request.id,
                part_name: itemName,
                name: itemName,
                quantity: quantity,
                unit_price: 0,
                is_labor: false
            });
        
        if (partError) console.error("Failed to link tire part:", partError);
    }

    return NextResponse.json({ ok: true, request });

  } catch (e: any) {
    console.error("Tire order error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}