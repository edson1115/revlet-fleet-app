import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// This handles the <a href="/api/auth/signout"> link you just clicked
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = await supabaseServer();

  // 1. Sign out of Supabase
  await supabase.auth.signOut();

  // 2. Redirect to the Login Page
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}