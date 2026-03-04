import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServerRoute } from "@/lib/supabase/server-route";

function isAdminRole(role?: string) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export async function GET() {
  // ✅ Auth check using SSR client (handles chunked cookies)
  const supabaseAuth = await supabaseServerRoute();
  const {
    data: { user },
    error: userErr,
  } = await supabaseAuth.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (user.user_metadata?.role as string | undefined) ?? undefined;
  if (!isAdminRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ✅ Service role read of system_settings
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin
    .from("system_settings")
    .select("value")
    .eq("key", "ai_config")
    .single();

  if (error || !data) {
    // Default settings if none found
    return NextResponse.json({
      openai_api_key: "",
      ai_model: "gpt-4.1-mini",
      ai_temperature: "0.2",
    });
  }

  return NextResponse.json(data.value);
}

/**
 * POST handler as a fallback for existing fetch logic
 */
export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ success: true, updated: body });
}