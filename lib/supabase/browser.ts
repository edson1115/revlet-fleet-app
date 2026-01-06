"use client";

import { createBrowserClient } from "@supabase/ssr";

export function supabaseBrowser() {
  // 1. Manually Parse the Token from Browser Cookies
  let manualAccessToken: string | undefined = undefined;

  if (typeof document !== "undefined") {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith("sb-revlet-auth-token="));

    if (match) {
      const cookieValue = match.split("=")[1];
      try {
        // Decode and Parse your custom JSON format
        const decodedValue = decodeURIComponent(cookieValue);
        const session = JSON.parse(decodedValue);
        if (session?.access_token) {
          manualAccessToken = session.access_token;
        }
      } catch (e) {
        // Fallback: If not JSON, maybe it's just the token string
        manualAccessToken = cookieValue;
      }
    }
  }

  // 2. Create Client with the Forced Token
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // ⚠️ FORCE AUTH: Pass the token directly to bypass parsing issues
      global: {
        headers: manualAccessToken
          ? {
              Authorization: `Bearer ${manualAccessToken}`,
            }
          : undefined,
      },
      cookieOptions: {
        name: "sb-revlet-auth-token",
      },
    }
  );
}