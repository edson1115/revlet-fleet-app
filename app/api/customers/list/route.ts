// app/api/customers/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { normalizeRole } from "@/lib/permissions";

function supabaseServer(req: NextRequest) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${cookies().get("sb-access-token")?.value ?? ""}`,
        },
      },
    }
  );
}

export async function GET(req: NextRequest) {
  try {
    const supabase = supabaseServer(req);

    // ---------------------------------------------------
    // AUTH CHECK
    // ---------------------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = normalizeRole(user.user_metadata?.role);
    const INTERNAL = ["OFFICE", "DISPATCH", "FLEET_MANAGER", "ADMIN", "SUPERADMIN"];

    if (!role || !INTERNAL.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ---------------------------------------------------
    // QUERY PARAMS
    // ---------------------------------------------------
    const search = req.nextUrl.searchParams.get("search") || "";
    const market = req.nextUrl.searchParams.get("market") || "";
    const active = req.nextUrl.searchParams.get("active") || "";
    const page = Number(req.nextUrl.searchParams.get("page") || "1");
    const limit = Number(req.nextUrl.searchParams.get("limit") || "20");

    const offset = (page - 1) * limit;

    // ---------------------------------------------------
    // CALL RPC
    // Returns full list; we filter in JS
    // ---------------------------------------------------
    const { data: list, error } = await supabase.rpc("get_customer_list");

    if (error) {
      console.error("RPC get_customer_list error:", error);
      return NextResponse.json({ error: "Failed loading customer list" }, { status: 500 });
    }

    let rows = list || [];

    // ---------------------------------------------------
    // FILTERING (search, market, active)
    // ---------------------------------------------------
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((c: any) => c.name?.toLowerCase().includes(s));
    }

    if (market) {
      rows = rows.filter((c: any) => (c.market || "").toLowerCase() === market.toLowerCase());
    }

    if (active === "true") {
      rows = rows.filter((c: any) => c.active === true);
    }
    if (active === "false") {
      rows = rows.filter((c: any) => c.active === false);
    }

    // ---------------------------------------------------
    // PAGINATION
    // ---------------------------------------------------
    const total = rows.length;
    const paginated = rows.slice(offset, offset + limit);

    return NextResponse.json({
      rows: paginated,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("CUSTOMER LIST API ERROR:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";



