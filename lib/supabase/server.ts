import { cookies as nextCookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// 🚨 IMPORTANT — DO NOT call cookies() at module level
// Next.js 15 requires cookies() to be awaited inside route handlers.

export function supabaseServer() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          try {
            const cookieStore = await nextCookies(); // ✅ Next.js 15 requirement
            return cookieStore.get(name)?.value;
          } catch {
            return undefined;
          }
        },

        async set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieStore = await nextCookies(); // ✅ must be awaited
            cookieStore.set(name, value, options);
          } catch {
            // Ignore writes outside route handlers
          }
        },

        async remove(name: string, options: CookieOptions) {
          try {
            const cookieStore = await nextCookies();
            cookieStore.set(name, "", { ...options, maxAge: 0 });
          } catch {
            // ignore
          }
        },
      },
    }
  );
}
