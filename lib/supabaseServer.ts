// /lib/supabaseServer.ts
import { cookies as nextCookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function supabaseServer() {
  // In RSC renders, cookies is read-only; in actions/route handlers it’s mutable.
  // Next 15 requires awaiting dynamic APIs before using their values.
  const store = await nextCookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Prefer the service role key on the server, otherwise fall back to anon
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // READ is always OK
        get(name: string) {
          return store.get(name)?.value;
        },

        // WRITE may throw in RSC; swallow during renders so calls don’t crash
        set(name: string, value: string, options?: CookieOptions) {
          try {
            // Next 15 may support both signatures; use the classic one.
            store.set(name, value, options);
          } catch {
            // no-op in RSC; Supabase will try again in a server action/route
          }
        },

        remove(name: string, options?: CookieOptions) {
          try {
            // Next 15 supports delete(name) or delete({ name, ...options })
            // Call the object signature for maximum compatibility.
            // @ts-expect-error – types differ between Next versions
            store.delete({ name, ...options });
          } catch {
            // no-op in RSC
          }
        },
      },
    }
  );
}
