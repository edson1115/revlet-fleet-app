"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get("email") as string;
  const cookieStore = await cookies();

  // FIX: Use createServerClient from @supabase/ssr instead of createClient from @supabase/supabase-js
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // 2. Send the Magic Link (Server-Side)
  // Since the Server sends this, it sets the "Verifier Cookie" correctly.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // We hardcode the origin to ensure it matches the server's view
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}