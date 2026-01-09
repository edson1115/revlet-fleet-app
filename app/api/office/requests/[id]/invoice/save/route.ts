import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import { logActivity } from "@/lib/audit/logActivity";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = await resolveUserScope();
  const { id } = await params;

  if (!scope.uid || scope.role !== "OFFICE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { laborCost, partsTotal, taxAmount, grandTotal, partsMarkup } = body;

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
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. (Optional) Save individual part sell prices if you have a separate table for that
  // For now, we assume the aggregate is enough for the MVP.

  // 3. Log it
  await logActivity({
    request_id: id,
    actor_id: scope.uid,
    actor_role: scope.role,
    action: "INVOICE_FINALIZED",
    message: `Invoice finalized for $${grandTotal}`,
    meta: { grandTotal, laborCost }
  });

  return NextResponse.json({ ok: true });
}