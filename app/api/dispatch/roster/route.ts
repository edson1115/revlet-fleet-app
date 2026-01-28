import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. Await cookies() (Next.js 15 Requirement)
  const cookieStore = await cookies();

  // 2. Manually create Supabase Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
  
  try {
    const { tech_id, start_time } = await req.json();

    if (!tech_id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    // 3. Save to Database
    const { error } = await supabase
      .from("profiles")
      .update({ current_shift_start: start_time }) 
      .eq("id", tech_id);

    if (error) {
        console.error("Supabase Write Error:", error);
        throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Roster API Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}