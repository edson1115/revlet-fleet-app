import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Setup Supabase
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { } },
        },
      }
    );

    // 2. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 3. Parse & Sanitize Body
    const body = await req.json();
    
    const { 
        force_update, // Frontend flag
        scheduled_at, // Frontend date field
        ...rest 
    } = body;

    // Start with basic fields
    const updatePayload: any = { ...rest };

    // ✅ FIX: Map 'scheduled_at' to the correct DB column 'scheduled_start_at'
    if (scheduled_at !== undefined) {
        updatePayload.scheduled_start_at = scheduled_at;
    }

    // 4. Update Database
    const { data, error } = await supabase
      .from("service_requests")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
        console.error("Supabase Update Error:", error);
        throw error;
    }

    return NextResponse.json({ ok: true, request: data });

  } catch (e: any) {
    console.error("Dispatch API Error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}