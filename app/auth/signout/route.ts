// app/auth/signout/route.ts
import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = supabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect("/login?msg=signedout");
}
