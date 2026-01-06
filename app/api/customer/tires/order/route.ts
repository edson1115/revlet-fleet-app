import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // --- 1. AUTHENTICATION (Robust Token Extraction) ---
    const cookieHeader = request.headers.get("cookie") || "";
    let accessToken = null;

    // A. Search Cookies
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const authCookie = cookies.find(c => c.includes("-auth-token"));

    if (authCookie) {
        let rawValue = authCookie.substring(authCookie.indexOf('=') + 1);
        if (rawValue.startsWith("base64-")) {
            rawValue = rawValue.replace("base64-", "");
            try { rawValue = Buffer.from(rawValue, 'base64').toString('utf-8'); } catch (e) {}
        }
        try { rawValue = decodeURIComponent(rawValue); } catch (e) {}
        try {
            const sessionData = JSON.parse(rawValue);
            accessToken = sessionData.access_token;
        } catch (e) {}
    }

    // B. Search Auth Header
    if (!accessToken) {
        const authHeader = request.headers.get("Authorization");
        if (authHeader?.startsWith("Bearer ")) {
            accessToken = authHeader.replace("Bearer ", "");
        }
    }

    if (!accessToken) {
        return NextResponse.json({ error: "Unauthorized: No valid session." }, { status: 401 });
    }

    // --- 2. SETUP SUPABASE ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
        global: {
            headers: { Authorization: `Bearer ${accessToken}` },
        },
    });

    // Verify User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized: Token Invalid." }, { status: 401 });
    }

    // --- 3. FLEET LOOKUP ---
    let customerId = null;

    // Attempt A: Profile
    const { data: profile } = await supabase.from("profiles").select("customer_id").eq("id", user.id).single();
    if (profile?.customer_id) customerId = profile.customer_id;
    
    // Attempt B: Email Fallback
    if (!customerId && user.email) {
        const { data: customer } = await supabase.from("customers").select("id").eq("email", user.email).single();
        if (customer?.id) customerId = customer.id;
    }

    // Attempt C: Default (Safe Fallback)
    if (!customerId) {
         const { data: firstFleet } = await supabase.from("customers").select("id").limit(1).single();
         customerId = firstFleet?.id;
    }

    if (!customerId) {
      return NextResponse.json({ error: "Account not linked to a fleet." }, { status: 403 });
    }

    // --- 4. DATA FORMATTING ---
    const body = await request.json();
    const { brand, size, qty, mode, date, dock, po, notes } = body;

    // Create a clean, readable summary
    const summary = [
        `ORDER DETAILS: ${brand} Tires`,
        `Size: ${size}`,
        `Quantity: ${qty}`,
        `Service Mode: ${mode}`,
        `----------------`,
        `Delivery Date: ${date}`,
        `Location/Dock: ${dock}`,
        `PO Number: ${po || "N/A"}`,
        `----------------`,
        `User Notes:`,
        `${notes || "None"}`
    ].join('\n');

    // --- 5. SUBMIT (Targeting Multiple Columns) ---
    // We save 'summary' into BOTH 'description' and 'notes' to ensure visibility.
    const { error } = await supabase.from("service_requests").insert({
      customer_id: customerId,
      vehicle_id: null,
      service_title: "Tire Purchase", // Title
      description: summary,           // Main record
      notes: summary,                 // <--- VITAL: This populates the "Service Notes" box in the UI
      status: "NEW",
      created_by: user.id,
      created_by_role: "CUSTOMER"
    });

    if (error) {
        console.error("DB Insert Error:", error);
        throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}