import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This is a PUBLIC route (read-only), so we use the Admin Key to fetch data
// The security is the UUID itself (impossible to guess)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Use Admin Client to bypass RLS (since customer has no login)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch Request with all details
  const { data: request, error } = await supabaseAdmin
    .from("service_requests")
    .select(`
      *,
      customer:customers(*),
      vehicle:vehicles(*),
      parts:request_parts(*)
    `)
    .eq("id", id)
    .single();

  if (error || !request) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // 2. Fetch Shop Settings
  const { data: settings } = await supabaseAdmin
    .from("shop_settings")
    .select("*")
    .eq("id", 1)
    .single();

  // 3. Calculate Totals (Mirroring Office Logic)
  const LABOR_RATE = settings?.labor_rate || 125.00;
  const TAX_RATE = settings?.tax_rate || 0.0825;

  const laborHours = request.labor_hours || 0;
  const laborTotal = laborHours * LABOR_RATE;
  
  // Sum up parts
  const partsTotal = request.parts.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);
  
  const subtotal = laborTotal + partsTotal;
  const tax = subtotal * TAX_RATE;
  const grandTotal = subtotal + tax;

  return NextResponse.json({
    ok: true,
    invoice: {
      ...request,
      shop_settings: settings,
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