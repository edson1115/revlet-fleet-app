// app/api/customer/vehicles/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Helper: Creates Correct Supabase Server Client */
function createClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookieStore.delete(name, options);
        },
      },
    }
  );
}

/** GET — Load all vehicles for this customer */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr || !profile)
      return NextResponse.json({ ok: false, error: "Profile load error" }, { status: 400 });

    if (!profile.customer_id)
      return NextResponse.json({ ok: false, error: "No customer linked" }, { status: 403 });

    const { data: vehicles, error: vehErr } = await supabase
      .from("vehicles")
      .select("*")
      .eq("customer_id", profile.customer_id)
      .order("created_at", { ascending: false });

    if (vehErr)
      return NextResponse.json({ ok: false, error: vehErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, vehicles: vehicles ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

/** POST — Add vehicle */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const body = await req.json();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.customer_id)
      return NextResponse.json({ ok: false, error: "User is not a customer" }, { status: 403 });

    const { vin, plate, make, model, year, unit_number } = body;

    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        vin,
        plate,
        make,
        model,
        year: year ? Number(year) : null,
        unit_number,
        customer_id: profile.customer_id,
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, vehicle: data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
