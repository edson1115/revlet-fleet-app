"use client";

import { createBrowserClient } from "@supabase/ssr";

export function supabaseBrowser() {
  // 1. Manually Parse the Token from Browser Cookies
  let manualAccessToken: string | undefined = undefined;

  if (typeof document !== "undefined") {
    // Look for your specific cookie name
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith("sb-revlet-auth-token="));

    if (match) {
      const cookieValue = match.split("=")[1];
      try {
        // Decode and Parse your custom JSON format if applicable
        const decodedValue = decodeURIComponent(cookieValue);
        // Attempt to parse as JSON (Supabase often stores session as JSON)
        try {
            const session = JSON.parse(decodedValue);
            if (session?.access_token) {
              manualAccessToken = session.access_token;
            } else {
                 // If JSON but no access_token property, might be the token itself?
                 // Unlikely for sb- token, but good fallback logic.
                 manualAccessToken = cookieValue;
            }
        } catch {
             // If not JSON, assume it is the raw token string
             manualAccessToken = cookieValue;
        }
      } catch (e) {
        // Fallback
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

// FIX: Export alias so other components can import 'createClient'
export const createClient = supabaseBrowser;