import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function POST(req: Request) {
  try {
    const scope = await resolveUserScope();
    if (!scope.uid || scope.role !== "CUSTOMER") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tire_size, quantity, po_number, location_name, notes } = body;

    const supabase = await supabaseServer();

    // Construct a readable description for the technician/office
    const description = `
      TIRE ORDER
      ----------------
      Size/Type: ${tire_size}
      Quantity: ${quantity}
      Location: ${location_name || "N/A"}
      PO Number: ${po_number || "N/A"}
      
      Notes:
      ${notes || "None"}
    `.trim();

    // Insert into MAIN service_requests table
    const { data, error } = await supabase
      .from("service_requests")
      .insert({
        customer_id: scope.customerId,
        vehicle_id: null, // Tire orders usually apply to the fleet or stock
        service_title: "Tire Purchase",
        service_description: description,
        status: "NEW", // This ensures it shows up as NEW on your dashboard
        created_by_user_id: scope.uid,
        created_by_role: "CUSTOMER"
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, request: data });

  } catch (e: any) {
    console.error("Tire order error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}