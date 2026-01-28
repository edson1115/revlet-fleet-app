import { createClient } from "@supabase/supabase-js"; 
import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: Request) {
  // 1. Init Supabase ADMIN Client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const body = await req.json().catch(() => ({})); 
    const targetIds = body.recipients || []; 

    console.log("🔍 Notify Targets:", targetIds.length > 0 ? targetIds : "ALL");

    // 2. Build Query
    // ✅ FIX: Only use uppercase "TECHNICIAN" or "TECH" to prevent DB Crash
    let query = supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, current_shift_start")
      .in("role", ["TECHNICIAN", "TECH"]) 
      .not("current_shift_start", "is", null)
      .neq("current_shift_start", "");

    if (targetIds.length > 0) {
        query = query.in("id", targetIds);
    }

    const { data: techs, error } = await query;

    // 3. Handle DB Errors
    if (error) {
        console.error("Supabase Admin Query Error:", error);
        return NextResponse.json({ message: "Database error.", details: error.message }, { status: 500 });
    }

    if (!techs || techs.length === 0) {
        return NextResponse.json({ message: "No technicians found to notify." }, { status: 404 });
    }

    console.log(`✅ Found ${techs.length} techs to notify.`);

    // 4. Initialize Twilio
    let client;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try { client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN); } 
        catch (e) { console.error("Twilio Init Failed:", e); }
    }

    const results = [];

    // 5. Processing Loop
    for (const tech of techs) {
      // ✅ LOGIC: If no phone, we skip SMS but STILL log it for Slack
      if (!tech.phone) {
          console.log(`⚠️ Skipping SMS for ${tech.full_name}: No Phone Number`);
          results.push({ tech: tech.full_name, time: tech.current_shift_start, status: "no_phone" });
          continue; 
      }

      if (client) {
        try {
          await client.messages.create({
            body: `🚗 REVLET: Hi ${tech.full_name}, your shift begins at ${tech.current_shift_start}. Check your app for today's queue.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: tech.phone,
          });
          results.push({ tech: tech.full_name, time: tech.current_shift_start, status: "sent" });
        } catch (err: any) {
          console.error(`SMS Error ${tech.full_name}:`, err.message);
          results.push({ tech: tech.full_name, time: tech.current_shift_start, status: "failed", error: err.message });
        }
      } else {
          results.push({ tech: tech.full_name, time: tech.current_shift_start, status: "simulated" });
      }
    }

    // 6. Send Slack Summary
    // This will now run even if SMS failed or phone numbers were missing
    if (process.env.SLACK_WEBHOOK_URL && results.length > 0) {
        const rosterText = results.map(r => {
            if (r.status === 'sent') return `✅ *${r.tech}*: ${r.time}`;
            if (r.status === 'simulated') return `📝 *${r.tech}*: ${r.time} (Simulated)`;
            if (r.status === 'no_phone') return `⚠️ *${r.tech}*: ${r.time} (No Phone Number)`;
            return `❌ *${r.tech}*: ${r.time} (SMS Failed)`;
        }).join("\n");

        await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: "Dispatch Notification",
                blocks: [
                    { type: "header", text: { type: "plain_text", text: "📨 Roster Notification Sent", emoji: true } },
                    { type: "section", text: { type: "mrkdwn", text: rosterText } }
                ]
            })
        });
    }

    return NextResponse.json({ success: true, results });

  } catch (e: any) {
    console.error("Route Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}