import { NextResponse } from "next/server";
import { supabaseServerRoute } from "@/lib/supabase/server-route";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const supabase = await supabaseServerRoute();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active_market")
      .eq("id", user.id)
      .single();

    const ALLOWED = new Set(["OFFICE", "DISPATCH", "ADMIN", "SUPERADMIN"]);

    if (!profile || !ALLOWED.has(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: market } = await supabase
      .from("markets")
      .select("id")
      .eq("code", profile.active_market)
      .single();

    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 403 });
    }

    let query = supabase
      .from("service_requests")
      .select(
        `
        id,
        type,
        status,
        urgent,
        created_at,
        vehicle:vehicles (
          year,
          make,
          model,
          plate
        ),
        customer:customers (
          name
        )
      `
      )
      .eq("market_id", market.id)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Query failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, rows: data });
  } catch (e) {
    console.error("OFFICE REQUESTS ERROR:", e);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
