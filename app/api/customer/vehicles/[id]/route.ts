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

  // AUTH
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // PROFILE → customer_id
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr || !profile?.customer_id) {
    return NextResponse.json({ error: "No customer linked" }, { status: 403 });
  }

  // VEHICLE
  const { data: vehicle, error: vehErr } = await supabase
    .from("vehicles")
    .select("id, make, model, year, unit_number, plate, vin")
    .eq("id", id)
    .eq("customer_id", profile.customer_id)
    .maybeSingle();

  if (vehErr || !vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  // SERVICE REQUESTS
  const { data: requests, error: reqErr } = await supabase
    .from("service_requests")
    .select("id, status, created_at")
    .eq("vehicle_id", id)
    .order("created_at", { ascending: false });

  if (reqErr) {
    return NextResponse.json({ error: reqErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    vehicle,
    requests: requests ?? [],
  });
}
