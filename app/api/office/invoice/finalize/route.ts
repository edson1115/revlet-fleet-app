import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use Service Role to bypass restrictions if needed
  );

  try {
    const body = await req.json();
    const { requestId, customerId, laborCost, partsCost, taxAmount, totalAmount, invoiceNumber } = body;

    // 1. Create or Update the Invoice Record
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .upsert({
        service_request_id: requestId,
        customer_id: customerId,
        invoice_number: invoiceNumber,
        status: "SENT", // Mark as Sent/Finalized
        labor_cost: laborCost,
        parts_cost: partsCost,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        due_date: new Date().toISOString() // Due immediately
      }, { onConflict: "service_request_id" })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // 2. Update the Service Request Status to BILLED
    const { error: ticketError } = await supabase
      .from("service_requests")
      .update({ status: "BILLED" })
      .eq("id", requestId);

    if (ticketError) throw ticketError;

    return NextResponse.json({ success: true, invoice });

  } catch (error: any) {
    console.error("Invoice Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}