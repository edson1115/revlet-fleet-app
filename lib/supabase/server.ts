// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function supabaseServer() {
  // ✅ Next 15 requires cookies() to be awaited
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value;
        },
        async set(name: string, value: string, options: any) {
          try {
            (await cookieStore).set({ name, value, ...options });
          } catch {
            /* ignore write errors during RSC phase */
          }
        },
        async remove(name: string, options: any) {
          try {
            (await cookieStore).set({
              name,
              value: "",
              ...options,
              maxAge: 0,
            });
          } catch {}
        },
      },
    }
  );

  return supabase;
}
