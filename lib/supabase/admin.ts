// /lib/supabase/admin.ts

import { createClient } from "@supabase/supabase-js";

/**
 * Server-side admin client
 * Uses SERVICE ROLE key (full access)
 * - MUST NOT be exposed to users or client-side
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase admin env vars missing: SUPABASE_SERVICE_ROLE"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
