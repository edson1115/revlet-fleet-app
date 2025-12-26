import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. Sign out from Supabase
  await supabase.auth.signOut();

  // 2. Redirect to Login (Must use absolute URL)
  // We use 'new URL' to combine the path '/' with your current domain
  return NextResponse.redirect(new URL("/", req.url), {
    status: 302,
  });
}