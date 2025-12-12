import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: (n, v, o) => cookieStore.set(n, v, o),
        remove: (n, o) => cookieStore.delete(n, o),
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" });

  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.customer_id)
    return NextResponse.json({ ok: false, error: "Forbidden" });

  // Ensure visibility only for your customer’s vehicles
  const { data: faults, error } = await supabase
    .from("vehicle_faults")
    .select("*")
    .eq("vehicle_id", id)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ ok: false, error: error.message });

  return NextResponse.json({
    ok: true,
    faults: faults || [],
  });
}
