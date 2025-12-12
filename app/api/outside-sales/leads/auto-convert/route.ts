import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const body = await req.json();
    const { lead_id } = body;

    // 1. Load lead
    const { data: lead } = await supabase
      .from("sales_leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (!lead) return NextResponse.json({ ok: false, error: "Lead not found" });

    // 2. Create Customer
    const { data: customer, error: errCustomer } = await supabase
      .from("customers")
      .insert({
        name: lead.customer_name,
        address: lead.company_name,
        market: lead.target_market,
        active: true
      })
      .select()
      .single();

    if (errCustomer) throw errCustomer;

    // 3. Connect lead → customer
    await supabase
      .from("sales_leads")
      .update({
        converted_customer_id: customer.id,
        auto_converted: true,
        last_sync_at: new Date()
      })
      .eq("id", lead_id);

    // 4. Auto-create login for customer
    const { data: magic } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: lead.customer_email,
      options: {
        data: {
          role: "CUSTOMER",
          customer_id: customer.id,
          market: lead.target_market
        }
      }
    });

    // 5. Insert into sync_logs
    await supabase.from("customer_sync_logs").insert({
      lead_id,
      customer_id: customer.id,
      action: "auto_convert",
      details: {
        msg: "Lead automatically converted into customer",
        magicLink: magic?.properties?.action_link
      }
    });

    return NextResponse.json({ ok: true, customer });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
