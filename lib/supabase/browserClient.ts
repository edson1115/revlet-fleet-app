"use client";

import { createBrowserClient } from "@supabase/ssr";

export const REVLET_COOKIE_NAME = "sb-revlet-auth-token";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (_client) return _client;

  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Keep cookie name aligned with your app
      cookieOptions: { name: REVLET_COOKIE_NAME },
    }
  );

  return _client;
}