import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  // FIX: Use the modern getAll/setAll pattern for Supabase SSR + Next.js 15
  // This avoids the 'cookieStore.delete(name, options)' signature error entirely
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  // check profile
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    // ⭐ DO NOT assign fake or static customer IDs
    await supabase.from("profiles").insert([
      {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? "Customer User",
        role: "CUSTOMER",
        customer_id: null,     // ⭐ FIX
        active: true,
      },
    ]);
  }

  return NextResponse.json({ ok: true });
}