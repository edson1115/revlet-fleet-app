// lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // MUST be set

  if (!url) throw new Error("Supabase URL is required");
  if (!serviceRoleKey) throw new Error("SupabaseKey is required"); // your error came from here

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
