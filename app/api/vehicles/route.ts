import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // FIX: Await cookies() for Next.js 15 support
    const cookieStore = await cookies();
    const token = cookieStore.get("sb-access-token")?.value || "";

    // Create client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // 1) Auth user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get role from jwt
    const roleRaw = user.user_metadata?.role || null;
    const role = normalizeRole(roleRaw);

    const scope = req.nextUrl.searchParams.get("scope") || "internal";

    // 2) Build Query
    let query = supabase
      .from("vehicles")
      .select(
        `
          id,
          customer_id,
          unit_number,
          plate,
          vin,
          year,
          make,
          model,
          market,
          created_at,
          customer:customers(name)
        `
      )
      .order("created_at", { ascending: false });

    /* ------------------------------------------------------------
          customer scope → only vehicles tied to this customer’s id
       ------------------------------------------------------------ */
    if (scope === "customer" && role === "CUSTOMER") {
      // Assuming user.id links to customer_id directly or via profile
      // Adjust if your schema requires a lookup
      query = query.eq("customer_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Vehicle fetch error:", error);
      return NextResponse.json(
        { error: "Failed to load vehicles" },
        { status: 500 }
      );
    }

    return NextResponse.json({ rows: data || [] });
  } catch (err: any) {
    console.error("Vehicles API Error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err?.message },
      { status: 500 }
    );
  }
}