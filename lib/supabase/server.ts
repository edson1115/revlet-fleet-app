// lib/supabase/server.ts
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * ✅ Use in:
 * - Route Handlers (/app/api/**)
 * - Server Components
 *
 * REQUIRED for Next.js App Router:
 * - cookies()
 * - headers()
 */
export async function supabaseServer() {
  const cookieStore = await cookies();
  const headerStore = headers();

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
            // ignore (read-only contexts)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete(name, options);
          } catch {
            // ignore
          }
        },
      },
      headers: {
        get(name: string) {
          return headerStore.get(name) ?? undefined;
        },
      },
    }
  );
}

/**
 * ✅ Service Role client (NO RLS)
 * Server-side ONLY
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
