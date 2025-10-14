// lib/supabase/server.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function createServerSupabase() {
  // Next 15: cookies() is async
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anon, {
    cookies: {
      // These callbacks can be async in Next 15
      async get(name: string) {
        return cookieStore.get(name)?.value;
      },
      async set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options });
      },
      async remove(name: string, options: any) {
        cookieStore.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });
}
