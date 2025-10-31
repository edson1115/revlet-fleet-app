// app/api/admin/vehicles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Admin Vehicles API
 *
 * - GET    /api/admin/vehicles?customer_id=...
 * - POST   /api/admin/vehicles
 * - DELETE /api/admin/vehicles?id=...
 *
 * Requires: superadmin OR office-level with correct company.
 * We're currently logged in as SUPERADMIN per your note.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customer_id") || null;

  const supabase = await supabaseServer();

  // get current profile to gate the route
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // load profile to check role/company
  const { data: profile, error: profileErr } = await supabase
    .from("app_users")
    .select("id, role, company_id")
    .eq("auth_uid", user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  // superadmin can see all
  const isSuperadmin = profile.role === "SUPERADMIN" || profile.role === "ADMIN";

  let query = supabase
    .from("vehicles")
    .select(
      `
      id,
      company_id,
      customer_id,
      unit_number,
      year,
      make,
      model,
      vin,
      plate
    `
    )
    .order("created_at", { ascending: false });

  if (customerId) {
    query = query.eq("customer_id", customerId);
  } else if (!isSuperadmin && profile.company_id) {
    // Office-level: limit to their company
    query = query.eq("company_id", profile.company_id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    company_id?: string | null;
    customer_id?: string | null;
    unit_number?: string;
    year?: number | null;
    make?: string | null;
    model?: string | null;
    vin?: string | null;
    plate?: string | null;
  };

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await supabaseServer();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileErr } = await supabase
    .from("app_users")
    .select("id, role, company_id")
    .eq("auth_uid", user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  const isSuperadmin = profile.role === "SUPERADMIN" || profile.role === "ADMIN";

  // If not superadmin, force company_id to their own
  const effectiveCompanyId =
    isSuperadmin ? body.company_id ?? null : profile.company_id;

  if (!effectiveCompanyId && !isSuperadmin) {
    return NextResponse.json(
      { error: "Company is required for non-superadmin" },
      { status: 400 }
    );
  }

  const insertPayload = {
    company_id: effectiveCompanyId,
    customer_id: body.customer_id ?? null,
    unit_number: body.unit_number ?? "",
    year: body.year ?? null,
    make: body.make ?? null,
    model: body.model ?? null,
    vin: body.vin ?? null,
    plate: body.plate ?? null,
  };

  const { data, error } = await supabase
    .from("vehicles")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("app_users")
    .select("role")
    .eq("auth_uid", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "SUPERADMIN" && profile.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
