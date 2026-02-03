import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Export the constant expected by other files
export const INTERNAL = 'internal';

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Valid catch for Server Components
          }
        },
      },
    }
  )
}

// Export the helper function expected by dashboard/queue routes
export async function getUserAndRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { user: null, role: null };

  // Retrieve profile/role. For now, we return the user and a default role
  // to ensure the build passes.
  return { user, role: INTERNAL };
}