// lib/systemSettings.ts
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Fetch a system-wide setting (AI keys, model, temperature, etc.)
 */
export async function getSystemSetting(key: string): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  return data?.value ?? null;
}

/**
 * For future admin UI updates
 */
export async function setSystemSetting(key: string, value: string) {
  const supabase = await supabaseServer();
  await supabase
    .from("system_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
}



