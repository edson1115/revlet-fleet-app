import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request, { params }: any) {
  const leadId = params.id;
  const body = await req.json();

  const { email, businessName, market } = body;

  const supabase = await supabaseServer();

  try {
    // --------------------------------------------------
    // 1. LOAD LEAD
    // --------------------------------------------------
    const { data: lead, error: leadErr } = await supabase
      .from("sales_leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadErr || !lead) {
      return NextResponse.json(
        { ok: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 2. CREATE CUSTOMER ROW
    // --------------------------------------------------
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .insert({
        business_name: businessName,
        primary_contact_email: email,
        market,
        created_by_sales_rep: lead.sales_rep_id,
        lead_id: lead.id,
      })
      .select()
      .single();

    if (custErr) {
      return NextResponse.json(
        { ok: false, error: "Failed to create customer: " + custErr.message },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. CREATE DEFAULT LOGIN USER FOR CUSTOMER
    // --------------------------------------------------
    const newUserPayload = {
      email,
      email_confirm: true,
    };

    const { data: signUpRes, error: signUpErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        role: "CUSTOMER",
        customer_id: customer.id,
      },
    });

    if (signUpErr) {
      return NextResponse.json(
        { ok: false, error: "Failed to create user: " + signUpErr.message },
        { status: 400 }
      );
    }

    const newUser = signUpRes.user;

    // --------------------------------------------------
    // 4. CREATE PROFILE ROW FOR NEW USER
    // --------------------------------------------------
    await supabase.from("profiles").insert({
      id: newUser.id,
      email,
      role: "CUSTOMER",
      active: true,
      customer_id: customer.id,
    });

    // --------------------------------------------------
    // 5. SEND MAGIC LINK INVITE
    // --------------------------------------------------
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    // --------------------------------------------------
    // 6. UPDATE LEAD → CONVERTED
    // --------------------------------------------------
    await supabase
      .from("sales_leads")
      .update({
        status: "CONVERTED",
        converted_customer_id: customer.id,
        converted_at: new Date().toISOString(),
      })
      .eq("id", lead.id);

    // --------------------------------------------------
    // 7. INSERT LEAD UPDATE HISTORY
    // --------------------------------------------------
    await supabase.from("sales_lead_updates").insert({
      lead_id: lead.id,
      update_type: "STATUS_CHANGE",
      meta: {
        from: lead.status,
        to: "CONVERTED",
      },
    });

    // --------------------------------------------------
    // 8. RETURN SUCCESS
    // --------------------------------------------------
    return NextResponse.json({
      ok: true,
      customer,
      user: newUser,
      message: "Lead successfully converted into customer",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e.message || "Server error",
      },
      { status: 500 }
    );
  }
}
