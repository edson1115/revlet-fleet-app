// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * ✅ Use this in:
 * - Route Handlers (/app/api/**)
 * - Server Components (async pages/layouts are fine)
 *
 * Next.js 15 requires awaiting cookies() in dynamic contexts,
 * and Route Handlers are one of them.
 */
export async function supabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // ignore if called from a context that can't mutate cookies
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete(name, options);
          } catch {
            // ignore if called from a context that can't mutate cookies
          }
        },
      },
    }
  );
}

/**
 * ✅ Service Role client (NO RLS) — use ONLY in server code (never client).
 * Typical uses:
 * - Storage uploads
 * - Admin tasks
 */
export function supabaseService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
