// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  const supabase = await supabaseServer();
  try {
    // Clears auth cookies server-side
    await supabase.auth.signOut();
  } catch {}
  return NextResponse.json({ ok: true });
}
