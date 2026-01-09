import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import { EmailTemplates } from "@/lib/email/templates"; // 👈 Added Import

export const dynamic = "force-dynamic";

/* ============================================================
   GET — Calculate Invoice (Reads Shop Settings)
============================================================ */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = await resolveUserScope();
  const { id } = await params;

  if (!scope.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await supabaseServer();

  // 1. Fetch Request
  const { data: request, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      customer:customers(*),
      vehicle:vehicles(*),
      parts:request_parts(*)
    `)
    .eq("id", id)
    .single();

  if (error || !request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 2. Fetch Shop Settings (The Brain) 🧠
  const { data: settings } = await supabase
    .from("shop_settings")
    .select("*")
    .eq("id", 1)
    .single();

  // Fallback defaults if settings fail
  const LABOR_RATE = settings?.labor_rate || 125.00;
  const TAX_RATE = settings?.tax_rate || 0.0825;

  // 3. Calculate
  const laborHours = request.labor_hours || 0;
  const laborTotal = laborHours * LABOR_RATE;
  const partsTotal = request.parts.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);
  
  const subtotal = laborTotal + partsTotal;
  const tax = subtotal * TAX_RATE;
  const grandTotal = subtotal + tax;

  return NextResponse.json({
    ok: true,
    invoice: {
      ...request,
      shop_settings: settings, // Send this to UI so the PDF has correct address!
      financials: {
        labor_rate: LABOR_RATE,
        tax_rate: TAX_RATE,
        labor_hours: laborHours,
        labor_total: laborTotal,
        parts_total: partsTotal,
        subtotal,
        tax,
        grand_total: grandTotal
      }
    }
  });
}

/* ============================================================
   POST — Finalize Invoice & Email Receipt
============================================================ */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = await resolveUserScope();
  const { id } = await params;
  const body = await req.json(); // { status: 'BILLED', grand_total: 123.45 }

  const supabase = await supabaseServer();

  // 1. Update Status & Fetch Customer Details for Email
  const { data: updatedRequest, error } = await supabase
    .from("service_requests")
    .update({
      status: "BILLED", // or COMPLETED
      invoice_grand_total: body.grand_total, // Save the final amount for analytics
      completed_at: new Date().toISOString()
    })
    .eq("id", id)
    .select(`
        *, 
        customer:customers(email, name), 
        vehicle:vehicles(year, model)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. 📧 TRIGGER: EMAIL RECEIPT
  // We call our internal API which checks the "Enable Email" setting automatically
  if (updatedRequest.customer?.email) {
      const vehicleName = `${updatedRequest.vehicle?.year} ${updatedRequest.vehicle?.model}`;
      const totalFormatted = parseFloat(body.grand_total).toFixed(2);

      // Fire and forget (don't await the result to keep UI snappy)
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/system/send-email`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              to: updatedRequest.customer.email,
              subject: `Receipt: ${vehicleName}`,
              // ... inside POST ...
html: EmailTemplates.invoicePaid(
    updatedRequest.customer.name, 
    vehicleName, 
    totalFormatted, 
    id // 👈 Pass the ID here!
)
          })
      }).catch(err => console.error("Receipt Email Failed:", err));
  }

  return NextResponse.json({ ok: true });
}