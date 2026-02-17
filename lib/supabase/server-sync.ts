import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function supabaseServerSync() {
  // FIX: In Next.js 15, cookies() is always asynchronous
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}