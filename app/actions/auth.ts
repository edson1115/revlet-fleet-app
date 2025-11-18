// app/actions/auth.ts
"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function getMeServer() {
  // ✅ FIX: Await the supabase server client
  const supabase = await supabaseServer();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return {
      ok: false,
      user: null,
      error: error?.message ?? "Not authenticated",
    };
  }

  return {
    ok: true,
    user: data.user,
    error: null,
  };
}
