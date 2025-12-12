import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set(name, value, options);
        },
        remove(name, options) {
          cookieStore.delete(name, options);
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
