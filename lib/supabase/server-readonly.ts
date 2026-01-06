import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function supabaseServerReadonly() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // 🚫 NO setAll here — READ ONLY
      },
    }
  );
}
