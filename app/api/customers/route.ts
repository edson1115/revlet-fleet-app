// app/api/customers/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ------------------------------------------------------------
// POST /api/customers
// Creates a new customer
// ------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const body = await req.json();

    // ------------------------------------------------------------
    // AUTH → get user + normalized role
    // ------------------------------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = normalizeRole(user.user_metadata?.role);
    const userMarket = user.user_metadata?.market || "San Antonio";

    const INTERNAL = new Set([
      "OFFICE",
      "ADMIN",
      "SUPERADMIN",
      "DISPATCH",
      "FLEET_MANAGER",
    ]);

    if (!role || !INTERNAL.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ------------------------------------------------------------
    // BODY VALIDATION
    // ------------------------------------------------------------
    const {
      name,
      address,
      approval_type,
      billing_contact,
      market_id,
    } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // MARKET ENFORCEMENT
    // ------------------------------------------------------------

    // OFFICE → Force to their own market
    const finalMarket =
      role === "ADMIN" || role === "SUPERADMIN"
        ? market_id // Admins may choose a market
        : userMarket; // Office is locked to 1 market

    // ------------------------------------------------------------
    // INSERT
    // ------------------------------------------------------------
    const { data, error } = await supabase
      .from("customers")
      .insert([
        {
          name,
          address: address || null,
          approval_type: approval_type || "AUTO",
          billing_contact: billing_contact || null,
          market: finalMarket,
          active: true,
        },
      ])
      .select()
      .maybeSingle();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json(
        { error: "Failed to create customer" },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // SUCCESS
    // ------------------------------------------------------------
    return NextResponse.json({ ok: true, customer: data }, { status: 200 });
  } catch (err: any) {
    console.error("CUSTOMER CREATE ERROR:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}



