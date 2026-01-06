import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
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

    // 3. SAFETY CHECK: Fetch status of ALL requests for this vehicle
    const { data: requests, error: fetchError } = await supabase
      .from("service_requests")
      .select("status")
      .eq("vehicle_id", id)
      .eq("customer_id", scope.customer_id); // Ensure ownership

    if (fetchError) {
      console.error("Fetch Error:", fetchError);
      return NextResponse.json({ ok: false, error: "Database error checking history." }, { status: 500 });
    }

    // 4. FILTER IN JAVASCRIPT
    const activeRequests = requests?.filter(r => 
        r.status !== 'COMPLETED' && r.status !== 'CANCELLED'
    ) || [];

    if (activeRequests.length > 0) {
      return NextResponse.json({ 
        ok: false, 
        error: `Cannot archive: This vehicle has ${activeRequests.length} active service request(s). Please wait for them to finish.` 
      }, { status: 400 });
    }

    // 5. PROCEED: Soft Delete
    const { error: updateError } = await supabase
      .from("vehicles")
      .update({ status: "ARCHIVED" })
      .eq("id", id)
      .eq("customer_id", scope.customer_id); // Ensure ownership

    if (updateError) {
      console.error("Archive Error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}