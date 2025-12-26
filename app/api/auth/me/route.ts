import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    // 1. Get Auth User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
    }

    // 2. Get Profile + Customer Name
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        *,
        customer:customers (
          name
        )
      `)
      .eq("id", user.id)
      .single();

    if (profileError) {
      // Return basic user info if profile is missing (prevents crash)
      return NextResponse.json({ 
          ok: true, 
          user: { 
              email: user.email, 
              role: "GUEST",
              customer_name: "Unknown Account" 
          } 
      });
    }

    // 3. Return combined data
    return NextResponse.json({ 
      ok: true, 
      user: {
        ...profile,
        email: user.email,
        customer_name: profile.customer?.name || "Private Account"
      }
    });

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}