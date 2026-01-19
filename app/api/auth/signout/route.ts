import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function signOutAction(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = await supabaseServer();

  // 1. Sign out of Supabase (Clears the cookies)
  await supabase.auth.signOut();

  // 2. Redirect to Login (Using 302 to force browser to switch to GET)
  return NextResponse.redirect(`${requestUrl.origin}/login`, {
    status: 302,
  });
}

// ✅ Handle the button click (POST)
export async function POST(request: Request) {
  return signOutAction(request);
}

// ✅ Handle manual link clicks (GET)
export async function GET(request: Request) {
  return signOutAction(request);
}