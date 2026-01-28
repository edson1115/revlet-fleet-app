import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    // 1. Check Env Vars
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ Missing Supabase Keys in .env.local");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2. Parse Body
    const body = await req.json();
    const { ticket_id, scheduled_start, tech_id, bypass_confirmation, key_location_override } = body;

    console.log("dispatch/propose payload:", body); // 🔍 Debug Log

    if (!ticket_id || !scheduled_start || !tech_id) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 3. Determine Logic
    // If Bypass is ON -> Go straight to 'SCHEDULED'
    // If Bypass is OFF -> Go to 'WAITING_CONFIRMATION'
    const newStatus = bypass_confirmation ? "SCHEDULED" : "WAITING_CONFIRMATION";
    
    const updateData: any = {
        scheduled_start_at: scheduled_start,
        technician_id: tech_id,
        status: newStatus,
        updated_at: new Date().toISOString()
    };

    // Handle Keys
    if (bypass_confirmation) {
        updateData.key_location = key_location_override || "Authorized by Dispatch (Bypass)";
    }

    // 4. Perform Update
    const { error } = await supabase
      .from("service_requests")
      .update(updateData)
      .eq("id", ticket_id);

    if (error) {
        console.error("❌ Database Error:", error); // 🔍 Watch your terminal for this!
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, status: newStatus });

  } catch (err: any) {
      console.error("❌ Server Crash:", err);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}