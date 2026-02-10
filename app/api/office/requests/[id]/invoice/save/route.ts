import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import { createServiceLog } from "@/lib/api/logs"; // Use the known logger

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const requestId = params.id;
  const scope = await resolveUserScope();

  if (!scope.uid || scope.role !== "OFFICE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { laborCost, partsTotal, taxAmount, grandTotal } = body;

    const supabase = await supabaseServer();

    // 1. Update the Request with Invoice Totals
    const { error } = await supabase
      .from("service_requests")
      .update({
        invoice_labor_cost: laborCost,
        invoice_parts_total: partsTotal,
        invoice_tax_amount: taxAmount,
        invoice_grand_total: grandTotal,
        invoice_finalized_at: new Date().toISOString(),
        status: "BILLED" // ✅ Automatically move status to BILLED
      })
      .eq("id", requestId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Log it
    // FIX: Wrap message and meta in 'details' to satisfy LogInput type
    await createServiceLog({
      request_id: requestId,
      actor_id: scope.uid,
      actor_role: scope.role,
      action: "INVOICE_FINALIZED",
      details: {
        message: `Invoice finalized for $${grandTotal}`,
        grandTotal,
        laborCost,
        partsTotal,
        taxAmount
      }
    });

    return NextResponse.json({ ok: true });
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}