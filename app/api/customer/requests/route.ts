import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set(name, value, options);
        },
        remove(name, options) {
          cookieStore.delete(name, options);
        },
      },
    }
  );

  // USER
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // PROFILE
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr || !profile?.customer_id) {
    return NextResponse.json(
      { ok: false, error: "Not a customer" },
      { status: 403 }
    );
  }

  // REQUESTS
  const { data: requests, error: reqErr } = await supabase
    .from("service_requests")
    .select(`
      id,
      status,
      service,
      created_at,
      scheduled_start_at,
      vehicle:vehicles (
        make, model, year, plate, unit_number
      )
    `)
    .eq("customer_id", profile.customer_id)
    .order("created_at", { ascending: false });

  if (reqErr) {
    return NextResponse.json(
      { ok: false, error: reqErr.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, requests });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
