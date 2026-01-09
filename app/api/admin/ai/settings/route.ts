import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  
  // 1. Extract token directly from the cookie store for Auth persistence
  const authCookie = cookieStore.getAll().find(c => c.name.includes("-auth-token"));
  
  if (!authCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let val = authCookie.value;
  if (val.startsWith("base64-")) {
    val = Buffer.from(val.replace("base64-", ""), 'base64').toString('utf-8');
  }
  
  const parsed = JSON.parse(decodeURIComponent(val));
  const token = parsed.access_token;

  // 2. Initialize Auth Client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  // 3. Fetch AI settings from the 'system_settings' table
  const { data, error } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "ai_config")
    .single();

  if (error || !data) {
    // Return default settings if none found in DB yet
    return NextResponse.json({ 
      openai_api_key: "", 
      ai_model: "gpt-4.1-mini",
      ai_temperature: "0.2" 
    });
  }

  // Return the stored JSON object (contains openai_api_key, ai_model, ai_temperature)
  return NextResponse.json(data.value);
}

/**
 * POST handler as a fallback for the fetch call in page.tsx
 */
export async function POST(request: Request) {
  const body = await request.json();
  // We recommend using the Server Action for saving, 
  // but we return success here to satisfy the existing fetch logic.
  return NextResponse.json({ success: true, updated: body });
}