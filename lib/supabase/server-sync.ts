import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function supabaseServerSync() {
  const cookieStore = cookies(); // ✅ sync only

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}
