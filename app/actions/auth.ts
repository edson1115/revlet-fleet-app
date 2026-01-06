"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get("email") as string;
  const cookieStore = await cookies();

  // 1. Create a Server-Side Client
  // This client can securely set cookies in your browser
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false,
      },
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
            // Ignored
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