// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// ---------------------------------------------------------
// 1) SYNC CLIENT — used in Server Components (NO awaiting)
// ---------------------------------------------------------
export function supabaseServerSync() {
  const cookieStore = cookies(); // sync in SC

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          /* ignored — cannot modify cookies in SC */
        },
        remove() {
          /* ignored — cannot modify cookies in SC */
        },
      },
    }
  );
}

// ---------------------------------------------------------
// 2) ASYNC CLIENT — used ONLY in Route Handlers (/api/*)
// ---------------------------------------------------------
export async function supabaseServer() {
  const cookieStore = await cookies(); // MUST await in API routes

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
          } catch {}
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete(name, options);
          } catch {}
        },
        
      },
    }
  );
}

// ---------------------------------------------------------
// 3) SERVICE CLIENT — full access (Storage upload, no RLS)
// ---------------------------------------------------------
import { createClient } from "@supabase/supabase-js";

export function supabaseService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,   // << REQUIRED
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

