import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  // ✅ FIX: Move Resend initialization inside the handler to prevent build-time crash
  const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Simulation Mode / Safety check
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
    console.error("System Email API Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}