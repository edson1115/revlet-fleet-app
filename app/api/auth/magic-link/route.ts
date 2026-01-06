import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const json = await request.json(); // Handle JSON body if used
    const email = json.email;

    // 1. Create Client with PKCE Flow explicitly enabled
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: 'pkce', // <--- CRITICAL FIX: Forces "code" instead of "token"
        },
      }
    );

    // 2. Send the Magic Link
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Ensure this matches your folder structure exactly
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`, 
      },
    });

    if (error) {
      console.error("Supabase Auth Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}