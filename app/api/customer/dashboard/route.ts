// app/api/customer/dashboard/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();

  // Create server client (same pattern as magic-link + logout)
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

  // 1) AUTH
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

  // 2) PROFILE
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json(
      { ok: false, error: profileErr.message },
      { status: 400 }
    );
  }

  if (!profile?.customer_id) {
    return NextResponse.json(
      { ok: false, error: "No customer linked to this profile" },
      { status: 403 }
    );
  }

  const custId = profile.customer_id;

  // 3) DASHBOARD STATS (RPC)
  const { data: rpcStats, error: rpcErr } = await supabase.rpc(
    "customer_dashboard_stats",
    { cust_id: custId }
  );

  if (rpcErr) {
    return NextResponse.json(
      { ok: false, error: rpcErr.message },
      { status: 500 }
    );
  }

  const stats = {
    total_requests: rpcStats?.total_requests ?? 0,
    open_requests: rpcStats?.open_requests ?? 0,
    completed_requests: rpcStats?.completed_requests ?? 0,
    vehicles: rpcStats?.vehicles ?? 0,
  };

  // 4) RECENT REQUESTS
  const { data: recent, error: reqErr } = await supabase
    .from("service_requests")
    .select(
      `
      id,
      status,
      service,
      created_at,
      vehicle:vehicles (
        id,
        make,
        model,
        year
      )
    `
    )
    .eq("customer_id", custId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (reqErr) {
    return NextResponse.json(
      { ok: false, error: reqErr.message },
      { status: 500 }
    );
  }

  // SUCCESS
  return NextResponse.json({
    ok: true,
    stats,
    recent_requests: recent ?? [],
  });
}
