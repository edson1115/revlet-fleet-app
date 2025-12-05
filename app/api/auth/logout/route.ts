import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  const supabase = await supabaseServer();

  try {
    // Clear the Supabase session cookies
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Logout error:", err);
  }

  return NextResponse.json({ ok: true });
}
