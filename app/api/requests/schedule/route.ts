// app/api/requests/schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

async function makeSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: any) { try { cookieStore.set({ name, value, ...options }); } catch {} },
        remove(name: string, options: any) { try { cookieStore.set({ name, value: "", ...options }); } catch {} },
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { id, technician_id, scheduled_at } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await makeSupabase();
    const patch: Record<string, any> = {};
    if (typeof technician_id !== "undefined") patch.technician_id = technician_id || null;
    if (typeof scheduled_at !== "undefined") patch.scheduled_at = scheduled_at;

    const { error } = await supabase.from("service_requests").update(patch).eq("id", id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to schedule" }, { status: 400 });
  }
}
