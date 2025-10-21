// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Read-only Supabase client for Server Components / loaders.
 * Never attempts to set/delete cookies (no-ops), so it won't throw in RSC.
 */
export async function supabaseServerRO() {
  const cookieStore = await cookies(); // Next 15: must await
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      },
    }
  );
}

/**
 * Read–write Supabase client for Route Handlers or Server Actions ONLY.
 * Safe to call cookies().set/delete here.
 */
export async function supabaseRoute() {
  const cookieStore = await cookies(); // Next 15: must await

  // Keep an in-memory jar so subsequent reads see the latest values
  const jar = new Map(cookieStore.getAll().map((c) => [c.name, c.value]));

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return jar.get(name);
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options }); // ✅ allowed in route handlers
          jar.set(name, value);
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options }); // ✅ allowed in route handlers
          jar.delete(name);
        },
      },
    }
  );
}

/**
 * ✅ Compatibility alias so existing code that imports `supabaseServer`
 * continues to work. It is the read-only client.
 */
export const supabaseServer = supabaseServerRO;
