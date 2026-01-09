import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseServer } from "@/lib/supabase/server";

// Initialize Resend with your API Key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    
    // 1. CHECK THE MASTER SWITCH 🛑
    const { data: settings } = await supabase
        .from("shop_settings")
        .select("enable_email_notifications")
        .single();

    if (!settings?.enable_email_notifications) {
        console.log("🔕 Emails are DISABLED in Settings. Skipping.");
        return NextResponse.json({ ok: true, skipped: true });
    }

    // 2. Prepare the Email
    const body = await req.json(); // Expects: { to, subject, html }

    // Simulation Mode (If you haven't added the Key to .env.local yet)
    if (!process.env.RESEND_API_KEY) {
        console.log("📧 [EMAIL SIMULATION] To:", body.to, "Subject:", body.subject);
        return NextResponse.json({ ok: true, simulated: true });
    }

    // 3. Send via Resend
    const { data, error } = await resend.emails.send({
      from: 'Revlet <onboarding@resend.dev>', // Change to your domain later
      to: [body.to],
      subject: body.subject,
      html: body.html,
    });

    if (error) {
        console.error("Resend Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}