import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

// GET: Load Settings
export async function GET() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("shop_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Return defaults if table is empty
  const settings = data || {
      labor_rate: 125.00,
      tax_rate: 0.0825,
      enable_email_notifications: false
  };

  return NextResponse.json(settings);
}

// POST: Save Settings (Uses Admin Key to guarantee save)
export async function POST(req: Request) {
  const scope = await resolveUserScope();

  // 1. Strict Auth Check
  if (!scope.uid || scope.role !== "OFFICE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // 2. Use Admin Client (Bypasses RLS blocks)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabaseAdmin
    .from("shop_settings")
    .upsert({
      id: 1, // Always update row 1
      shop_name: body.shop_name,
      shop_address: body.shop_address,
      shop_phone: body.shop_phone,
      labor_rate: parseFloat(body.labor_rate),
      tax_rate: parseFloat(body.tax_rate),
      enable_email_notifications: body.enable_email_notifications
    });

  if (error) {
    console.error("Settings Save Error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}