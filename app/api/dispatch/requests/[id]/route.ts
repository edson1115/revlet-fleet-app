import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await params (Next.js 15 requirement)
    const { id } = await params;
    
    // 2. Setup Supabase
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

    // 3. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 4. Update Database
    // We update whatever is passed in 'body' (status, technician_id, notes, etc.)
    const body = await req.json();

    const { data, error } = await supabase
      .from("service_requests")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, request: data });

  } catch (e: any) {
    console.error("Dispatch API Error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}