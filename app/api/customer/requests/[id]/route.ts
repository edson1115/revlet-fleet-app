import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function GET(
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

    // 3. Fetch the request (scoped to customer)
    const { data: serviceRequest, error } = await supabase
      .from("service_requests")
      .select(`
        *,
        vehicle:vehicles (*)
      `)
      .eq("id", id)
      .eq("customer_id", scope.customer_id) // Strict Ownership Check
      .single();

    if (error) {
      console.error("Fetch error:", error);
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, request: serviceRequest });

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}