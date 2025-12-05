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

  // AUTH
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // CUSTOMER
  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.customer_id) {
    return NextResponse.json(
      { ok: false, error: "Not a customer profile" },
      { status: 403 }
    );
  }

  // REQUEST
  const { data: request, error: reqErr } = await supabase
    .from("service_requests")
    .select(`
      id,
      status,
      service,
      po_number,
      vendor,
      urgent,
      key_drop,
      parking_location,
      created_at,
      scheduled_start_at,
      started_at,
      completed_at,
      vehicle:vehicles (
        id,
        make,
        model,
        year,
        unit_number,
        plate
      ),
      images:request_images (
        id,
        url_full,
        url_thumb,
        created_at
      )
    `)
    .eq("id", id)
    .eq("customer_id", profile.customer_id)
    .maybeSingle();

  if (reqErr) {
    return NextResponse.json({ ok: false, error: reqErr.message }, { status: 400 });
  }

  if (!request) {
    return NextResponse.json(
      { ok: false, error: "Request not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, request });
}
