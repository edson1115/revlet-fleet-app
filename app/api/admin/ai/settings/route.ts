// app/api/admin/ai/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { setSystemSetting, getSystemSetting } from "@/lib/systemSettings";

export async function GET() {
  const out = {
    openai_api_key: await getSystemSetting("openai_api_key"),
    ai_model: await getSystemSetting("ai_model"),
    ai_temperature: await getSystemSetting("ai_temperature"),
  };
  return NextResponse.json(out);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  await setSystemSetting("openai_api_key", body.openai_api_key || "");
  await setSystemSetting("ai_model", body.ai_model || "gpt-4.1-mini");
  await setSystemSetting("ai_temperature", body.ai_temperature || "0.2");

  return NextResponse.json({ ok: true });
}
